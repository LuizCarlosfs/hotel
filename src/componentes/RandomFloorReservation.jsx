// componente do botão Sortear Andar e Reservar
import React, { useState } from "react"
import { floors } from "../database/quartos.js"

const RandomFloorReservation = ({
  reservations = [],
  setReservations,
  checkIn,
  checkOut,
  customerName,
  setSelectedFloor,
}) => {
  const [selectedFloor] = useState(null)
  const [availableRooms, setAvailableRooms] = useState([])

  const isRoomAvailable = (roomNumber) => {
    if (!Array.isArray(reservations)) return true // Se reservations for undefined, assume que todos os quartos estão disponíveis
    return !reservations.some(
      (res) =>
        res.room === roomNumber &&
        checkIn &&
        checkOut &&
        !(checkOut <= res.checkIn || checkIn >= res.checkOut) // Verifica conflitos de datas
    )
  }

  const handleRandomFloorReservation = () => {
    if (!checkIn || !checkOut) {
      alert("Preencha as datas de entrada e saída antes de reservar.")
      return
    }

    if (!floors || floors.length === 0) {
      alert("Nenhum andar disponível.")
      return
    }

    const availableFloors = floors.filter(
      (floor) =>
        Array.isArray(floor.rooms) &&
        floor.rooms.some((room) => isRoomAvailable(room.number))
    )

    if (availableFloors.length === 0) {
      alert("Nenhum andar tem quartos disponíveis.")
      return
    }

    const randomFloor =
      availableFloors[Math.floor(Math.random() * availableFloors.length)]
    if (!randomFloor || !Array.isArray(randomFloor.rooms)) {
      alert("Erro ao sortear andar.")
      return
    }

    const availableRoomsInFloor = randomFloor.rooms.filter((room) =>
      isRoomAvailable(room.number)
    )
    setSelectedFloor(randomFloor)
    setAvailableRooms(availableRoomsInFloor)

    let numRoomsToReserve = parseInt(
      prompt(
        `O andar sorteado foi ${randomFloor.id}. Existem ${availableRoomsInFloor.length} quartos disponíveis. Quantos deseja reservar?`
      )
    )

    if (
      isNaN(numRoomsToReserve) ||
      numRoomsToReserve <= 0 ||
      numRoomsToReserve > availableRoomsInFloor.length
    ) {
      alert("Número inválido de quartos.")
      return
    }

    // Seleciona quartos aleatórios para reservar
    const shuffledRooms = availableRoomsInFloor.sort(() => 0.5 - Math.random())
    const selectedRooms = shuffledRooms.slice(0, numRoomsToReserve)

    const newReservations = selectedRooms.map((room) => ({
      room: room.number,
      checkIn,
      checkOut,
      customerName,
      price: room.price,
      isPrivate: true,
       cama: "Quarto"
    }))

    setReservations([...reservations, ...newReservations])
    
    const reservedRoomNumbers = selectedRooms.map(room => room.number).join(", ")
    alert(`${numRoomsToReserve} apartamentos reservados com sucesso! Quartos: ${reservedRoomNumbers}`)
  }

  return (
    <div>
      <button onClick={handleRandomFloorReservation}>
        Sortear Andar e Reservar
      </button>
      {selectedFloor && (
        <p>
          Andar {selectedFloor.id} sorteado. Quartos disponíveis: {" "}
          {availableRooms.length}
        </p>
      )}
    </div>
  )
}
export default RandomFloorReservation
