import React from "react"
import { gruposAp } from "../database/gruposAp"

const RoomList = ({
  floors,
  isBedAvailable,
  handleReserveRoom,
  handleReserveBed,
  handleReserveFloor,
  reservations,
  checkIn,
  checkOut
}) => {
  const isRoomReserved = (roomNumber) => {
    return reservations.some(
      (res) =>
        res.room === roomNumber &&
        !(
          new Date(checkOut) <= new Date(res.checkIn) ||
          new Date(checkIn) >= new Date(res.checkOut)
        )
    )
  }

  return (
    <div>
      {floors.map((floor) => {
        const isAnyBedOccupiedInFloor = floor.rooms.some((room) =>
          room.beds.some((_, bedIndex) => !isBedAvailable(room.number, bedIndex))
        )

        return (
          <div key={floor.id}>
            <h2 style={{ display: "inline-block", marginRight: "10px" }}>
              Andar {floor.id}
            </h2>
            <button
              onClick={() => handleReserveFloor(floor)}
              className='reserve-floor-button'
              disabled={isAnyBedOccupiedInFloor}
            >
              Reservar Andar Inteiro
            </button>

            {floor.rooms.map((room) => {
              const isRoomDisabled = isRoomReserved(room.number)

              const grupo = gruposAp.find((g) =>
                g.rooms.some((r) => r.number === room.number)
              )

              return (
                <div key={room.number} className='room-container'>
                  <h3>Quarto {room.number}</h3>
                  <button
                    className='reserve-room-button'
                    onClick={() => handleReserveRoom(room)}
                    disabled={isRoomDisabled} // Desabilita o botão se o quarto estiver reservado
                  >
                    Reservar Quarto Inteiro
                  </button>
                  {/* Se o quarto não for privado, mostrar as camas */}
                  {!room.isPrivate && (
                    <div>
                      {room.beds.map((_, bedIndex) => {
                        const available = isBedAvailable(room.number, bedIndex)
                        return (
                          <button
                            key={bedIndex}
                            className='bed-button'
                            disabled={!available}
                            onClick={() => handleReserveBed(room, bedIndex)}
                            style={grupo ? { color: "red" } : {}}
                          >
                            Cama {bedIndex + 1} (
                            {available ? "Disponível" : "Ocupado"})
                            {grupo ? ` - ${grupo.name}` : ""}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

export default RoomList
