import { Socket } from "socket.io-client";

export interface MessageData {
    username: string;
    message: string;
    room: string;
    date: string;
}

export interface ChatProps {
    socket: Socket;
    username: string;
    room: string;
}

export interface RoomProps {
    username: string;
    room: string;
    setUsername: React.Dispatch<React.SetStateAction<string>>;
    setRoom: React.Dispatch<React.SetStateAction<string>>;
    setChatScreen: React.Dispatch<React.SetStateAction<boolean>>;
    socket: Socket;
}
