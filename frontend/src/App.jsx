import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SchoolProfile from "./pages/SchoolProfile";
import Compare from "./pages/Compare";
import Navbar from "./components/Navbar";
import ChatBot from "./components/ChatBot";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/school/:id" element={<SchoolProfile />} />
        <Route path="/compare" element={<Compare />} />
      </Routes>
      <ChatBot />
    </BrowserRouter>
  );
}