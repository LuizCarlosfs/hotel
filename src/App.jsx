import React from "react"
import { createRoot } from "react-dom/client"
import "./App.css"
import { floors } from "./database/quartos.js"
import "../src/componentes/header.css"
import Header from "../src/componentes/Header"
import ReservationList from "./componentes/ReservationList"
import RoomList from "./componentes/RoomList"

const App = () => {
  const [refresh, setRefresh] = React.useState(0)
  const [reservations, setReservations] = React.useState(
    JSON.parse(localStorage.getItem("reservations")) || []
  )
  const [checkIn, setCheckIn] = React.useState(
    new Date().toISOString().split("T")[0]
  )
  const [checkOut, setCheckOut] = React.useState("")
  const [customerName, setCustomerName] = React.useState("")
  const [showEncontrarPorNumero, setShowEncontrarPorNumero] =
    React.useState(false)

  React.useEffect(() => {
    localStorage.setItem("reservations", JSON.stringify(reservations))
  }, [reservations])

  const isRoomAvailable = (roomNumber) => {
    return !reservations.some((res) => res.room === roomNumber)
  }


console.log({reservations})


  const isBedAvailable = (roomNumber, bedIndex) => {
    return !reservations.some(
      (res) =>
        res.room === roomNumber &&
        res.bedIndex === bedIndex &&
        !(
          new Date(checkOut) <= new Date(res.checkIn) ||
          new Date(checkIn) >= new Date(res.checkOut)
        )
    )
  }

  const handleReserveBed = (room, bedIndex) => {
    if (!customerName || !checkIn || !checkOut) {
      alert("Preencha todos os campos antes de reservar.")
      return
    }
    if (new Date(checkIn) >= new Date(checkOut)) {
      alert("A data de saída deve ser após a data de entrada.")
      return
    }
    if (isBedAvailable(room.number, bedIndex)) {
      setReservations([
        ...reservations,
        {
          room: room.number,
          bedIndex,
          checkIn,
          checkOut,
          customerName,
          price: room.priceBed,
          isPrivate: room.isPrivate,
          packedid:"",
          cama: `Cama ${bedIndex +1}`
          
        },
      ])
    } else {
      alert("Esta cama já está reservada para as datas selecionadas!")
    }
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
  
    const isRoomAlreadyReserved = reservations.some(
      (res) =>
        res.room === room.number &&
        !(
          new Date(checkOut) <= new Date(res.checkIn) ||
          new Date(checkIn) >= new Date(res.checkOut)
        )
    )
  
    if (isRoomAlreadyReserved) {
      alert("Este quarto já está reservado para as datas selecionadas!")
      return
    }
  
    if (
      window.confirm(
        `Deseja reservar o apartamento ${room.number} por R$ ${room.price}?`
      )
    ) {
      const newReservation = {
        room: room.number,
        checkIn,
        checkOut,
        customerName,
        price: room.price,
        isPrivate: true,
        cama: "Quarto"
      }
  
      setReservations((prevReservations) => [...prevReservations, newReservation])
  
      alert(`Apartamento ${room.number} reservado com sucesso!`)
    }
  }
  






  return (
    <div>
      <Header
        key={refresh}
        customerName={customerName}
        setCustomerName={setCustomerName}
        checkIn={checkIn}
        setCheckIn={setCheckIn}
        checkOut={checkOut}
        setCheckOut={setCheckOut}
        showEncontrarPorNumero={showEncontrarPorNumero}
        setShowEncontrarPorNumero={setShowEncontrarPorNumero}
        reservations={reservations}
        setReservations={setReservations}
        isRoomAvailable={isRoomAvailable}
        refresh={refresh}
        setRefresh={setRefresh}
      />
      <RoomList
        floors={floors}
        isBedAvailable={isBedAvailable}
        handleReserveRoom={handleReserveRoom}
        handleReserveBed={handleReserveBed}

        reservations={reservations}
        checkIn={checkIn}
        checkOut={checkOut}
 
      />
      <ReservationList
        reservations={reservations}
        setReservations={setReservations}
        checkIn={checkIn}
        checkOut={checkOut}
      />
    </div>
  )
}

export default App
