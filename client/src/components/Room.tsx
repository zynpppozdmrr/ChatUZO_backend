import React from "react";

import type { RoomProps } from "../types";


const Room = ({ username, room, setUsername, setRoom, setChatScreen, socket }: RoomProps) => {
    // az önce bi deneme mesajı gönderiyorduk, şimdi frontende room bilgisini gönderdik, çünkü aynı rooma girmelisni hedefliyorum
    const sendRoom = () => {
        socket.emit('room', room);
        setChatScreen(true);

    }
    return (
        <div className='flex items-center justify-center h-full'>
            <div className='w-1/3 h-[320px] rounded-lg bg-indigo-600 flex flex-col space-y-4 p-3'>
                <h1 className='text-center my-4 font-bold text-2xl'>WELCOME TO CHAT</h1>
                <input value={username} onChange={(e) => setUsername(e.target.value)} className="h-12 rounded-xl p-3 outline-none" type="text" placeholder='Username' />
                <input value={room} onChange={(e) => setRoom(e.target.value)} className="h-12 rounded-xl p-3 outline-none" type="text" placeholder='Room' />
                <div onClick={sendRoom} className='tracking-wider hover:opacity-70 text-white bg-indigo-900 border h-12 pt-2 text-xl text-center rounded-lg'>CHAT!!!</div>


            </div>

        </div>
    );
}
export default Room;