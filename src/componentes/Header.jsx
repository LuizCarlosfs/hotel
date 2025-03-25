import React, { useState } from "react"
import "./header.css"
import { floors } from "../database/quartos"
import { gruposAp } from "../database/gruposAp"
import RandomFloorReservation from "./RandomFloorReservation"
import EncontrarPorNumero from "./EncontrarPorNumero"
import EncontrarPorGrupo from "./EncontrarPorGrupo"

const Header = ({
  customerName,
  setCustomerName,
  checkIn,
  setCheckIn,
  checkOut,
  setCheckOut,
  showEncontrarPorNumero,
  setShowEncontrarPorNumero,
  reservations = [], // <- Garante que seja sempre um array
  setReservations,
  isRoomAvailable,
}) => {
  const [selectedFloor, setSelectedFloor] = React.useState("")
  const [showEncontrarPorGrupo, setShowEncontrarPorGrupo] = useState(false)

  const handleRandomReservation = () => {
    if (!checkIn || !checkOut || !customerName) {
      alert("Falta Digitar Nome ou Entrada ou Saída.")
      return
    }

    if (!selectedFloor) {
      alert("Selecione um andar antes de sortear.")
      return
    }

    const floor = floors.find((f) => f.id === parseInt(selectedFloor))
    if (!floor) return

    // Filtra os quartos que NÃO pertencem a um grupo
    const availableRooms = floor.rooms.filter((room) => {
      const isGrouped = gruposAp.some((group) =>
        group.rooms.some((r) => r.number === room.number)
      )
      return isRoomAvailable(room.number) && !isGrouped
    })

    // Verifica se há quartos disponíveis sem grupo
    if (availableRooms.length === 0) {
      // Se todos os disponíveis forem de grupo, exibe a mensagem apropriada
      const hasGroupRooms = floor.rooms.some((room) =>
        gruposAp.some((group) =>
          group.rooms.some((r) => r.number === room.number)
        )
      )

      if (hasGroupRooms) {
        alert(
          "Nenhum apartamento vago nesse andar, mas ainda tem os apartamentos de grupo."
        )
      } else {
        alert("Nenhum apartamento vago nesse andar.")
      }
      return
    }

    // Sorteia um quarto que não pertence a um grupo
    const randomRoom =
      availableRooms[Math.floor(Math.random() * availableRooms.length)]

    if (
      window.confirm(
        `O apartamento sorteado foi ${randomRoom.number}. Deseja reservar?`
      )
    ) {
      const newReservation = {
        room: randomRoom.number,
        checkIn,
        checkOut,
        customerName,
        price: randomRoom.price,
        isPrivate: true,
        packedid: randomRoom.packedid,
        cama: "Quarto",
      }
      setReservations([...reservations, newReservation])
    }
  }

  return (
    <div className='header'>
      <h1>Reserva de Quartos</h1>
      <label>
        Cliente:
        <input
          type='text'
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />
      </label>
      <label>
        Entrada:
        <input
          type='date'
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
        />
      </label>
      <label>
        Saída:
        <input
          type='date'
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
        />
      </label>

      {/* --------------- Sortear Apartamento após escolhido  um andar ----------------- */}

      <label>
        Reservar quarto no andar:
        <select
          value={selectedFloor}
          onChange={(e) => setSelectedFloor(e.target.value)}
        >
          <option value=''>Selecione</option>
          {floors.map((floor) => (
            <option key={floor.id} value={floor.id}>
              Andar {floor.id}
            </option>
          ))}
        </select>
      </label>

      <button onClick={handleRandomReservation}>Sortear Apartamento</button>
      <RandomFloorReservation
        reservations={reservations}
        setReservations={setReservations}
        checkIn={checkIn} // Certifique-se de que está sendo passado
        checkOut={checkOut} // Certifique-se de que está sendo passado
        customerName={customerName}
        setSelectedFloor={setSelectedFloor}
      />

      <button
        onClick={() => setShowEncontrarPorNumero(!showEncontrarPorNumero)}
      >
        Encontrar Por Número
      </button>
      {showEncontrarPorNumero && (
        <EncontrarPorNumero
          reservations={reservations}
          setReservations={setReservations}
          checkIn={checkIn}
          checkOut={checkOut}
          customerName={customerName}
        />
      )}

      <button onClick={() => setShowEncontrarPorGrupo(!showEncontrarPorGrupo)}>
        Encontrar por Grupo
      </button>

      {showEncontrarPorGrupo && (
        <EncontrarPorGrupo
          reservations={reservations}
          setReservations={setReservations}
          checkIn={checkIn}
          checkOut={checkOut}
          customerName={customerName}
        />
      )}
    </div>
  )
}

export default Header
