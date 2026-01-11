import React,{useState,useEffect} from "react";
import _ from 'lodash';
import "./MovieList.css";
import MovieCard from "./MovieCard";
import FilterGroup from "./FilterGroup";
const MovieList = ({type,title}) => {
  const[allMovies,setAllMovies]=useState([]);
  const[movies,setMovies]=useState([]);
  const[minRating,setMinRating]=useState(0);
  const[sort,setSort]=useState({
    by:"default",
    order:"asc"
  })
  useEffect(()=>{ 
    fetchMovies();  
  },[]);
  useEffect(()=>{
    applyFilterAndSort();
  },[minRating,sort,allMovies]);
  const fetchMovies=async()=>{
    const response=await fetch(
    `https://api.themoviedb.org/3/movie/${type}?api_key=183928bab7fc630ed0449e4f66ec21bd`
    );
    const data=await response.json();
    setAllMovies(data.results);
    setMovies(data.results);
  }
  const applyFilterAndSort=()=>{
    let updated=[...allMovies];
    if(minRating>0){
      updated=updated.filter((movie)=>movie.vote_average>=minRating)
    }
    if(sort.by!=="default"){
      updated=_.orderBy(updated,[sort.by],[sort.order]);
    }
    setMovies(updated);
 };
  const handleFilter=(rate)=>{
    setMinRating(rate);
  };
  const handleSort=(e)=>{
    const {name,value}=e.target;
    setSort(prev=>({...prev ,[name]:value}))
  };
  return (
    <section className="movie-list" id={type}>
      <header className="movie-list-header">
        <h2 className="movie-list-heading">{title} 🔥</h2>

        <div className="movie-list-fs">
          <FilterGroup minRating={minRating} 
          onRatingClick={handleFilter}
          ratings= {[8,7,6,0]} />

          <select name='by' id='' className="movie-sorting" onChange={handleSort} value={sort.by}>
            <option value='default'>Sort By</option>
            <option value='release_date'>Date</option>
            <option value='vote_average'>Rating</option>
          </select>
          <select name='order' id='' value={sort.order} onChange={handleSort} className="movie-sorting">
            <option value='asc'>Ascending</option>
            <option value='desc'>Descending</option>
          </select>
        </div>
      </header>
      <div className="movie-cards">
        {
        movies.map((movie)=>(<MovieCard key={movie.id} movie={movie}/>))
        }
    
      </div>
    </section>
  );
};
export default MovieList;
