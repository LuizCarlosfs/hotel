import React, { useState } from "react"
import { floors } from "../database/quartos"
import { gruposAp } from "../database/gruposAp"

const EncontrarPorNumero = ({
  reservations,
  setReservations,
  checkIn,
  checkOut,
  customerName,
}) => {
  const [roomNumber, setRoomNumber] = useState("")
  const [matchingRooms, setMatchingRooms] = useState([])
  const [groupRooms, setGroupRooms] = useState([])

  // Função para verificar se um quarto está disponível
  const isRoomAvailable = (roomNumber) => {
    return !reservations.some((res) => res.room === roomNumber)
  }

  const findRooms = () => {
    if (!roomNumber) {
      alert("Digite um número de apartamento.")
      return
    }

    const roomsFound = []
    let groupRoomsFound = []

    floors.forEach((floor) => {
      floor.rooms.forEach((room) => {
        if (String(room.number).endsWith(roomNumber)) {
          const isGrouped = gruposAp.some((group) =>
            group.rooms.some((r) => r.number === room.number)
          )

          if (!isGrouped && isRoomAvailable(room.number)) {
            roomsFound.push({ room, floor })
          } else if (isGrouped) {
            groupRoomsFound.push({
              room,
              floor,
              groupName: gruposAp.find((g) =>
                g.rooms.some((r) => r.number === room.number)
              ).name,
            })
          }
        }
      })
    })

    if (roomsFound.length === 0) {
      if (groupRoomsFound.length > 0) {
        alert(
          "Nenhum apartamento vago, mas ainda tem os apartamentos de grupo."
        )
      } else {
        alert("Nenhum apartamento vago encontrado.")
      }
    }

    setMatchingRooms(roomsFound)
    setGroupRooms(groupRoomsFound)
  }

  const handleReserveRoom = (room) => {
    if (!customerName || !checkIn || !checkOut) {
      alert("Preencha todos os campos antes de reservar.")
      return
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      alert("A data de saída deve ser após a data de entrada.")
      return
    }

    const newReservation = {
      room: room.number,
      checkIn,
      checkOut,
      customerName,
      price: room.price,
      isPrivate: true,
      packedid: room.packedid,
       cama: "Quarto",
    }

    setReservations([...reservations, newReservation])

    setMatchingRooms(
      matchingRooms.filter(({ room: r }) => r.number !== room.number)
    )

    alert(`Apartamento ${room.number} reservado com sucesso!`)
  }

  return (
    <div className='RelacaoAp'>
      <label>
        Buscar por número do apartamento:
        <input
          type='text'
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          placeholder='Digite os últimos 2 dígitos'
        />
      </label>
      <button onClick={findRooms}>Buscar</button>

      {matchingRooms.length > 0 && (
        <div>
          <h3>Apartamentos vagos:</h3>
          {matchingRooms.map(({ room, floor }) => (
            <div key={room.number}>
              <button onClick={() => handleReserveRoom(room)}>
                Reservar Quarto {room.number} - Andar {floor.id}
              </button>
            </div>
          ))}
        </div>
      )}

      {groupRooms.length > 0 && (
        <div>
          <h3>Apartamentos de grupo encontrados:</h3>
          {groupRooms.map(({ room, floor, groupName }) => (
            <div key={room.number}>
              <p>
                Quarto {room.number} - Andar {floor.id} - Grupo: {groupName}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default EncontrarPorNumero
