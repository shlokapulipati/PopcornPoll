import React from "react"
import './MovieCard.css'
import Star from '../../assets/star.png'
const MovieCard =({movie})=>{
    return(
        <a href={`https://www.themoviedb.org/movie/${movie.id}`} target="_blank" className='movie-card'>
            <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
             className="movie-poster"/>
            <div className="movie-details">
                <h3 className="movie-details-heading">{movie.original_title}</h3>
                <div>
                    <p>{movie.release_date}</p>
                    <p>{movie.vote_average} 
                        <img src={Star} alt="Star icon" className="card-emoji"/></p>
                </div>
                <p className="movie-description">{movie.overview.slice(0,100)+"..."}</p>
            </div>
        </a>
    )
}
export default MovieCard;
