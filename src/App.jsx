import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginAndSignup from './page/LoginAndSignup';
import Selectcategory from './page/Selectcategory';
import SelectCourse from './page/SelectCourse';
import Checkout from './page/Checkout';
import Dashboard from './page/Dashboard';
import InstructorDashboard from './page/InstructorDashboard';
import Quiz from './page/Quiz';

function App() {
  const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginAndSignup />} />
        <Route path="/category" element={<Selectcategory />} />
        <Route path="/Course" element={<SelectCourse />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/instructor-dashboard" element={<InstructorDashboard />} />
        <Route path="/quiz/:lectureId" element={<Quiz />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App
