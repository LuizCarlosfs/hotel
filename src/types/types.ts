

type Accommodation {
    roomId: number;
    packageId: number;
    description: string;
    price: number;
    kids: number;
    adults: number;
    isPrivate: boolean;
    accommodations: {
        unitId: number;
        name: string;
        description: string;
    }[]
}


type Database {
    accommodations:Accommodation[];
}


