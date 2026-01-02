import './App.css';
import { useState } from 'react';
import Room from './components/Room.js';
import Chat from './components/Chat.js';
import io from 'socket.io-client';

//backendin çalıştığı yer. frontend connect ediyor backend e.
//browser ile server arasında kalıcı bir bağlantı açılıyor.
// Bu bağlantı açıldığı an server tarafında io.on("connection", socket => ...) tetikleniyor.
//Ve server bize o kullanıcı için benzersiz bir socket objesi veriyor. (Bu socket = o tab’a özel kanal.)
//Yani her açık sekme = ayrı socket bağlantısı.
const socket = io('http://localhost:5000');


function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [chatScreen, setChatScreen] = useState(false);
  return (


    <div className="App">

      {
        !chatScreen ?
          <Room username={username} room={room} setUsername={setUsername} setRoom={setRoom} setChatScreen={setChatScreen} socket={socket} />
          :
          <Chat socket={socket} username={username} room={room} />
      }


    </div>
  );
}



export default App
