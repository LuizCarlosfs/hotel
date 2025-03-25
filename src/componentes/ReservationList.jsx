import React from "react"

const ReservationList = ({
  reservations,
  setReservations,
  checkIn,
  checkOut,
}) => {
  const filteredReservations = React.useMemo(() => {
    return reservations
      .filter((res) => {
        const checkOutDate = new Date(res.checkOut)
        const checkInDate = new Date(res.checkIn)

        return (
          checkOutDate >= new Date(checkIn) && checkInDate <= new Date(checkOut)
        )
      })
      .sort((a, b) => a.room - b.room || a.cama.localeCompare(b.cama))
  }, [reservations, checkIn, checkOut])

  const handleCheckOut = (roomEx, camaEx) => {
    setReservations(reservations.filter((res) => res.room !== roomEx || res.cama !== camaEx))
  }

  const reservationPairs = []
  for (let i = 0; i < filteredReservations.length; i += 2) {
    reservationPairs.push([filteredReservations[i], filteredReservations[i + 1] || null])
  }

  return (
    <div>
      <h2>Reservas</h2>
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Quarto</th>
            <th>Cama</th>
            <th>Entrada</th>
            <th>Saída</th>
            <th>Ação</th>
            <th>Cliente</th>
            <th>Quarto</th>
            <th>Cama</th>
            <th>Entrada</th>
            <th>Saída</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {reservationPairs.map(([res1, res2], index) => (
            <tr key={index}>
              {res1 ? (
                <>
                  <td>{res1.customerName}</td>
                  <td>{res1.room}</td>
                  <td>{res1.cama}</td>
                  <td>{res1.checkIn}</td>
                  <td>{res1.checkOut}</td>
                  <td>
                    <button onClick={() => handleCheckOut(res1.room, res1.cama)}>
                      Dar Baixa
                    </button>
                  </td>
                </>
              ) : (
                <><td></td><td></td><td></td><td></td><td></td><td></td></>
              )}
              {res2 ? (
                <>
                  <td>{res2.customerName}</td>
                  <td>{res2.room}</td>
                  <td>{res2.cama}</td>
                  <td>{res2.checkIn}</td>
                  <td>{res2.checkOut}</td>
                  <td>
                    <button onClick={() => handleCheckOut(res2.room, res2.cama)}>
                      Dar Baixa
                    </button>
                  </td>
                </>
              ) : (
                <><td></td><td></td><td></td><td></td><td></td><td></td></>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => setReservations([])}>
        Dar Baixa em Todas as Reservas
      </button>
    </div>
  )
}

export default ReservationList
