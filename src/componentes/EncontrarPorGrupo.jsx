import React, { useState } from "react"
import { floors } from "../database/quartos"
import { gruposAp } from "../database/gruposAp.js"

const EncontrarPorGrupo = ({
  reservations,
  setReservations,
  checkIn,
  checkOut,
  customerName,
}) => {
  // Estados para armazenar o grupo selecionado, os quartos disponíveis e a opção de extras
  const [selectedGroup, setSelectedGroup] = useState("")
  const [matchingRooms, setMatchingRooms] = useState([])
  const [wantsExtras, setWantsExtras] = useState(null)

  // Verifica se um quarto está disponível para reserva
  const isRoomAvailable = (roomNumber) => {
    return !reservations.some((res) => res.room === roomNumber)
  }

  // Conta quantos quartos já foram reservados para um determinado pacote
  const countReservedRooms = (packedId) => {
    return reservations.filter((res) => res.packedid === packedId).length
  }

  // Função chamada quando o usuário seleciona um grupo
  const handleGroupSelection = (groupName) => {
    setSelectedGroup(groupName) // Atualiza o estado do grupo selecionado
    setWantsExtras(null) // Reseta a escolha de extras
    
    const group = gruposAp.find((g) => g.name === groupName)
    if (group && group.packedId !== "") {
      // Pergunta se deseja contratar serviços extras
      window.confirm(
        `Deseja contratar serviços extras? Valor do quarto = R$ ${group.pricePackedId}? `
      )
        ? setWantsExtras(true)
        : setWantsExtras(false)
    }
  }

  // Busca quartos disponíveis dentro do grupo selecionado
  const findRoomsByGroup = () => {
    if (!selectedGroup) {
      alert("Selecione um grupo.")
      return
    }

    const group = gruposAp.find((g) => g.name === selectedGroup)
    if (!group) {
      alert("Grupo não encontrado.")
      return
    }

    const reservedCount = countReservedRooms(group.packedId)

    let roomsToReserve = []

    if (group.rooms.length === 0) {
      // Se o grupo não possui quartos predefinidos, pergunta quantos deseja alugar
      const quantity = parseInt(prompt("Quantos quartos deseja alugar?"), 10)

      if (isNaN(quantity) || quantity <= 0) {
        alert("Quantidade inválida.")
        return
      }

      // Impede reservas além do limite permitido
      if (quantity + reservedCount > group.roomsQT) {
        alert(
          `Erro: O grupo permite no máximo ${group.roomsQT} quartos. Atualmente já existem ${reservedCount} reservas.`
        )
        return
      }

      // Obtém todos os quartos disponíveis
      const allAvailableRooms = floors
        .flatMap((floor) => floor.rooms)
        .filter((room) => isRoomAvailable(room.number))

      if (allAvailableRooms.length < quantity) {
        alert(`Apenas ${allAvailableRooms.length} quartos estão disponíveis.`)
        return
      }

      // Seleciona aleatoriamente os quartos disponíveis
      roomsToReserve = allAvailableRooms.sort(() => Math.random() - 0.5).slice(0, quantity)

      // Realiza a reserva automaticamente
      reservarAutomaticamente(roomsToReserve, group)
    } else {
      // Filtra os quartos disponíveis dentro do grupo
      const availableRooms = group.rooms.filter((room) => isRoomAvailable(room.number))

      if (availableRooms.length === 0) {
        alert("Nenhum apartamento disponível para este grupo.")
        return
      }

      // Atualiza a lista de quartos disponíveis para exibição
      setMatchingRooms(availableRooms)
    }
  }

  // Realiza a reserva automática de múltiplos quartos
  const reservarAutomaticamente = (rooms, group) => {
    const reservationsToAdd = rooms.map((room) => {
      let price = wantsExtras ? group.pricePackedId : group.price

      return {
        room: room.number,
        checkIn,
        checkOut,
        customerName,
        price: price,
        isPrivate: true,
        packedid: group.packedId,
        cama: "Quarto",
      }
    })

    // Atualiza o estado das reservas
    setReservations((prevReservations) => [...prevReservations, ...reservationsToAdd])

    // Exibe os números dos quartos reservados
    const roomNumbers = rooms.map((room) => room.number).join(", ")
    alert(
      `Foram reservados ${rooms.length} quarto(s): ${roomNumbers}`
    )
  }

  return (
    <div className='RelacaoGrupo'>
      <label>
        Buscar por grupo de apartamentos:
        <select
          value={selectedGroup}
          onChange={(e) => handleGroupSelection(e.target.value)}
        >
          <option value=''>Selecione um grupo</option>
          {gruposAp.map((group) => (
            <option key={group.id} value={group.name}>
              {group.name}
            </option>
          ))}
        </select>
      </label>
      <button onClick={findRoomsByGroup}>Buscar</button>

      {selectedGroup && (
        <div>
          <h4>
            Quartos no pacote: {gruposAp.find((g) => g.name === selectedGroup)?.roomsQT} / Reservados: {countReservedRooms(gruposAp.find((g) => g.name === selectedGroup)?.packedId)}
          </h4>
        </div>
      )}

      {matchingRooms.length > 0 && (
        <div>
          <h3>Apartamentos vagos:</h3>
          {matchingRooms.map((room) => (
            <div key={room.number}>
              <button onClick={() => reservarAutomaticamente([room], gruposAp.find((g) => g.name === selectedGroup))}>
                Reservar-Quarto {room.number}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default EncontrarPorGrupo
