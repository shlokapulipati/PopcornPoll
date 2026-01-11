import React from 'react'
import './App.css'
import Navbar from './Components/Navbar/Navbar'
import MovieList from './Components/MovieList/MovieList'
const App =() =>{
  return(
    <div className='app'> 
      <Navbar/>
      <MovieList type="popular" title="Popular"/>
      <MovieList type="top_rated" title="Top_rated"/>
      <MovieList type="upcoming" title="Upcoming"/>
    </div>
  )
}
export default App
