import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import axios from "axios";
const host = "http://localhost:5000";

function App() {
  const [playlist, setPlaylist] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchPlaylist();
    try {
      const lastPlayingTrackString = localStorage.getItem("lastPlayingTrack");
      const lastPlayingPosition = parseFloat(
        localStorage.getItem("lastPlayingPosition")
      );
      if (lastPlayingTrackString) {
        const lastPlayingTrack = JSON.parse(lastPlayingTrackString);
        setCurrentTrack(lastPlayingTrack);
      }
      if (audioRef.current && lastPlayingPosition) {
        audioRef.current.currentTime = lastPlayingPosition;
        audioRef.current.play();
      }
    } catch (error) {
      console.error("Error parsing data from localStorage:", error);
    }
  }, []);

  const fetchPlaylist = async () => {
    try {
      const response = await axios.get(`${host}/playlist`);
      setPlaylist(response.data);
    } catch (error) {
      console.error("Error fetching playlist:", error);
    }
  };

  const handleUpload = async () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append("audioFile", selectedFile);

      try {
        await axios.post(`${host}/upload`, formData);
        fetchPlaylist();
        setSelectedFile(null);

        // Reset the value of the file input to clear the selected file
        document.getElementById("fileInput").value = "";
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handlePlay = (track) => {
    // Save the current track and position to localStorage
    localStorage.setItem("lastPlayingTrack", JSON.stringify(track));
    localStorage.setItem(
      "lastPlayingPosition",
      audioRef.current?.currentTime.toString() || "0"
    );
    setCurrentTrack(track);
    if (audioRef.current) {
      // audioRef.current.autoplay = false;
      audioRef.current.play();
    }
  };

  const handleEnded = () => {
    const currentIndex = playlist.findIndex(
      (track) => track._id === currentTrack._id
    );
    const nextTrack = playlist[(currentIndex + 1) % playlist.length]; // Use modulo to loop back to the start
    // Save the next track to localStorage
    localStorage.setItem("lastPlayingTrack", JSON.stringify(nextTrack));
    localStorage.setItem("lastPlayingPosition", "0"); // Reset position for the next track
    setCurrentTrack(nextTrack || null);

    if (audioRef.current) {
      audioRef.current.pause(); // Pause the current audio
      audioRef.current.currentTime = 0; // Reset currentTime to zero

      // Set the new source and wait for it to load before playing
      audioRef.current.src = `${host}/uploads/${nextTrack.filename}`;
      audioRef.current.load();

      // Once loaded, play the audio
      audioRef.current.onloadeddata = () => {
        audioRef.current.play();
        audioRef.current.onloadeddata = null; // Remove the event listener after playing
      };
    }
  };

  return (
    <div className="outer_container">
      <div className="container">
        <h1 className="heading">Music Player</h1>
        <div className="upload_container">
        <input
          type="file"
          accept=".mp3"
          id="fileInput"
          onChange={handleFileChange}
        />
        <button onClick={handleUpload} className="upload_button">Upload</button>
        </div>
        <div className="playlist_container">
            {playlist.map((track) => (
                <button onClick={() => handlePlay(track)} className="playlist_button" key={track._id}>
                  {track.filename}
                </button>
            ))}
        </div>
        {currentTrack && (
          <div className="current_playing">
            <p className="current_playing_name">{currentTrack.filename}</p>
            <audio
              controls
              ref={audioRef}
              onEnded={handleEnded}
              autoPlay
              src={`${host}/uploads/${currentTrack.filename}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
