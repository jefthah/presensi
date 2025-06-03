"use client";

import { useState, useEffect, useMemo } from "react";

// Data slide
const slides = [
  {
    image: "/images/slider/Slider_1.webp",
    text: "With LeADS, Learn as if you were to live forever",
  },
  {
    image: "/images/slider/Slider_2.webp",
    text: "LeADS: Learn Remotely From Anywhere",
  },
  {
    image: "/images/slider/Slider_3.webp",
    text: "LeADS: Access Your Course Today",
  },
  {
    image: "/images/slider/Slider_2.webp",
    text: "LeADS: Learn From Anywhere, On Any Device",
  },
];

export default function Slider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-slide setiap 5 detik
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Gunakan useMemo agar background image tidak dihitung ulang
  const backgroundImage = useMemo(() => {
    return `url(${slides[currentSlide].image})`;
  }, [currentSlide]);

  return (
    <div
      className="min-h-screen bg-cover bg-center relative flex items-center justify-center transition-all duration-700"
      style={{
        backgroundImage,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        willChange: "background-image",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      {/* Konten */}
      <div className="relative z-10 text-white text-center px-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
          {slides[currentSlide].text}
        </h1>

        {/* Indicator titik */}
        <div className="flex justify-center space-x-2">
          {slides.map((_, idx) => (
            <span
              key={idx}
              className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                idx === currentSlide ? "bg-white" : "bg-gray-500"
              }`}
            ></span>
          ))}
        </div>
      </div>
    </div>
  );
}
