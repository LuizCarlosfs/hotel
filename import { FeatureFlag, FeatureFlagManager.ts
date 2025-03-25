import { FeatureFlag, FeatureFlagManager } from '@business/feature-flags';
import { InventoryItem, SplitInventory } from '@data/api/types/inventory';
import { Accommodation } from '@data/models';
import { ShoppingCartAccommodation } from '@data/models/ShoppingCartItem';
import Store from '@data/stores/Store';

function getAccommodationsFromStore(): Accommodation[] {
  return Store.property.accommodations.model.items;
}

function getItemsInCart(): ShoppingCartAccommodation[] {
  return Store.property.cart.accommodations;
}

function getSplitInventory(): SplitInventory {
  return Store.property.accommodations.model.splitInventory;
}

function getIsBookableLimitEnabled() {
  return Store.property.accommodations.model.bookableLimitEnabled;
}

class Inventory {
  private accommodations: Accommodation[] = [];
  private accommodationsMap: Record<string, Accommodation> = {};
  private availableItems: InventoryItem[] = [];
  private blockedItems: InventoryItem[] = [];
  private isBookableLimitEnabled = false;
  private splitInventory: SplitInventory = [];

  private blockItem({
    roomId,
    unitId,
    quantity = 1,
  }: InventoryItem & { quantity?: number }) {
    const accommodation = this.getAccommodation({ roomId });
    if (!accommodation) return;

    const { canSelectSpecificRoom } = accommodation.sourceSettings;
    const index = this.availableItems.findIndex(
      (availableItem) =>
        availableItem.roomId === roomId &&
        (!canSelectSpecificRoom ||
          unitId === undefined ||
          availableItem.unitId === unitId)
    );

    if (index >= 0) {
      const removed = this.availableItems.splice(index, 1);
      this.blockedItems.push(...removed);
    }

    if (quantity > 1) {
      this.blockItem({ quantity: quantity - 1, roomId, unitId });
    }
  }

  private createAccommodationsMap(): Record<string, Accommodation> {
    return this.accommodations.reduce(
      (acc, item) => ({
        ...acc,
        [item.id]: item,
      }),
      {}
    );
  }

  getAccommodation({ roomId }: InventoryItem): Accommodation | undefined {
    return this.accommodationsMap[roomId];
  }

  getBookableLimit({ roomId }: InventoryItem): number {
    const accommodation = this.getAccommodation({ roomId });
    if (!accommodation) return 0;
    if (!this.isBookableLimitEnabled) return accommodation.available;
    return Math.min(
      accommodation.available,
      accommodation.sourceSettings.bookableLimit
    );
  }

  private getInventoryItems(): InventoryItem[] {
    const items: InventoryItem[] = [];
    this.accommodations.forEach((accommodation) => {
      const { canSelectSpecificRoom } = accommodation.sourceSettings;
      const units: InventoryItem[] = canSelectSpecificRoom
        ? accommodation.accommodations
        : Array.from({ length: accommodation.available }, (_, i) => ({
            roomId: accommodation.id,
            unitId: ${accommodation.id}-${i},
          }));
      items.push(...units);
    });
    return items;
  }

  getNumAvailableToBook({ roomId, unitId }: InventoryItem): number {
    const accommodation = this.getAccommodation({ roomId });
    if (!accommodation) return 0;
    const { canSelectSpecificRoom } = accommodation.sourceSettings;
    const numAvailable = this.availableItems.filter(
      (item) =>
        item.roomId === roomId &&
        (!canSelectSpecificRoom ||
          unitId === undefined ||
          item.unitId === unitId)
    ).length;
    return Math.min(numAvailable, this.getBookableLimit({ roomId }));
  }

  getNumBlockedUnits({ roomId }: InventoryItem): number {
    return this.blockedItems.filter((item) => item.roomId === roomId).length;
  }

  isRootSplitInventoryItem({ roomId }: InventoryItem): boolean {
    return this.splitInventory.some((item) => item.roomId === roomId);
  }

  recalculate() {
    this.accommodations = getAccommodationsFromStore().filter(
      (item, index, array) => array.findIndex((x) => x.id === item.id) === index
    );
    this.accommodationsMap = this.createAccommodationsMap();
    this.availableItems = this.getInventoryItems();
    this.blockedItems = [];
    this.splitInventory = getSplitInventory();
    this.isBookableLimitEnabled = getIsBookableLimitEnabled();

    const isSplitInventoryEnabled = FeatureFlagManager.isEnabled(
      FeatureFlag.restrictSplitInventory
    );

    if (!isSplitInventoryEnabled) {
      this.removeShoppingCartItems();
      return;
    }

    // Remove all physical items from shopping cart
    this.removeShoppingCartNotRootInventoryItems();
    this.removeShoppingCartRootInventoryItemsSubUnits();

    // Remove the virtual items from the shopping cart
    this.removeSplitInventoryRootItems();
  }

  private removeShoppingCartItems() {
    const inCartItems = getItemsInCart();
    inCartItems.forEach((inCart) => {
      this.blockItem({
        quantity: inCart.amount,
        roomId: inCart.item.id,
        unitId: inCart.unit,
      });
    });
  }

  private removeShoppingCartNotRootInventoryItems() {
    const inCartItems = getItemsInCart().filter(
      ({ item }) => !this.isRootSplitInventoryItem({ roomId: item.id })
    );

    inCartItems.forEach((inCart) => {
      this.blockItem({
        quantity: inCart.amount,
        roomId: inCart.item.id,
        unitId: inCart.unit,
      });
    });
  }

  private removeShoppingCartRootInventoryItemsSubUnits() {
    const inCartItems = getItemsInCart();
    const inCartRootInventoryItems = inCartItems.filter(({ item }) =>
      this.isRootSplitInventoryItem({ roomId: item.id })
    );

    inCartRootInventoryItems.forEach((inCart) => {
      this.removeSplitInventorySubItem(inCart);
    });
  }

  private removeSplitInventoryRootItems() {
    // Each accommodation type can have more than one config of split inventory
    // so we need to iterate over all the accommodations and check each split inventory
    for (const accommodation of this.accommodations) {
      const { canSelectSpecificRoom } = accommodation.sourceSettings;
      const splitInventoryRootOfRoomType = this.splitInventory
        .filter((item) => item.roomId === accommodation.id)
        .slice(0, canSelectSpecificRoom ? undefined : accommodation.available);

      if (splitInventoryRootOfRoomType.length === 0) {
        continue;
      }

      // create a temporary bucket with available items to be reduced only
      // within this accommodation type but for all the different split inventory entries
      let bucket = [...this.availableItems];
      for (const splitInventoryRootItem of splitInventoryRootOfRoomType) {
        const shouldBlock =
          splitInventoryRootItem.children.filter(
            (child) => !this.removeUnitFromBucket(child, bucket)
          ).length > 0;

        if (shouldBlock) {
          this.blockItem(splitInventoryRootItem);
        }

        // restore buckets when it can select specific room
        if (canSelectSpecificRoom) {
          bucket = [...this.availableItems];
        }
      }
    }
  }

  private removeSplitInventorySubItem(inCart: ShoppingCartAccommodation) {
    const accommodation = this.getAccommodation({ roomId: inCart.item.id });
    if (!accommodation) return;
    const { canSelectSpecificRoom } = accommodation.sourceSettings;

    const splitInventoryRootItems = this.splitInventory
      .filter(
        (item) =>
          item.roomId === inCart.item.id &&
          (!canSelectSpecificRoom ||
            inCart.unit === undefined ||
            item.unitId === inCart.unit)
      )
      .slice(0, inCart.amount);

    for (const splitInventoryRootItem of splitInventoryRootItems) {
      splitInventoryRootItem.children.forEach((unit) => this.blockItem(unit));
    }
  }

  private removeUnitFromBucket(
    { roomId, unitId }: InventoryItem,
    bucket: InventoryItem[]
  ): boolean {
    const accommodation = this.getAccommodation({ roomId });
    if (!accommodation) return false;
    const { canSelectSpecificRoom } = accommodation.sourceSettings;
    const index = bucket.findIndex(
      (item) =>
        item.roomId === roomId &&
        (!canSelectSpecificRoom ||
          unitId === undefined ||
          item.unitId === unitId)
    );
    bucket.splice(index, 1);
    return index > -1;
  }
}

export const inventory = new Inventory();