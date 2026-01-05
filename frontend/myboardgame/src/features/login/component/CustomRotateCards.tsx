import React, { useEffect, useState } from "react";
import "../css/login.css";

    {/* <MyCustomRotateCards
          src="2-Player Edition/Shuffle-A-Kraken-Emerges-and-Hes-Super-Upset.jpg"
          alt="card-1"
          angle={-30}
          offsetX={-100}
          offsetY={30}
        />
        <MyCustomRotateCards
          src="2-Player Edition/Nope-A-Jackanope-Bounds-into-the-Room.jpg"
          alt="card-2"
          angle={30}
          offsetX={100}
          offsetY={30}
        />
        <MyCustomRotateCards
          src="2-Player Edition/Exploding-Kitten-Alien.jpg"
          alt="card-3"
          angle={-15}
          offsetX={-75}
          offsetY={10}
        />
        <MyCustomRotateCards
          src="/2-Player Edition/Defuse-Via-3AM-Flatulence.jpg"
          alt="card-4"
          angle={15}
          offsetX={75}
          offsetY={10}
        />
        <MyCustomRotateCards
          src="/Original Edition/Attack-Bear-o-Dactyl.jpg"
          alt="card-5"
          angle={0}
          offsetX={0}
        /> */}

type CardProps = {
  src: string;
  alt?: string;
  angle?: number; // độ (mặc định 15)
  className?: string;
  offsetX?: number;
  offsetY?: number;
};

export default function MyCustomRotateCards({
  src,
  alt = "image",
  angle = 15,
  className = "",
  offsetX = 0,
  offsetY = 0,
}: CardProps) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const updateScale = () => {
      const baseWidth = 1200;
      const w = window.innerWidth;
      const s = Math.max(0.45, Math.min(1.2, w / baseWidth))
      setScale(s)
    }
    updateScale();
    window.addEventListener("resize", updateScale)

    return () => window.removeEventListener("resize", updateScale)
  }, [])
  const innerStyle: React.CSSProperties = {
    transform: `scale(${scale}) rotate(${angle}deg)`,
    transformOrigin: "50% 100%", // bottom-center
  };

  return (
    <div
      className={`custom-deck-card ${className}`}
      style={{
        left: `calc(50% + ${offsetX}px)`,
        top: `calc(50% + ${offsetY}px)`,
      }}
    >
      <div className="custom-deck-card-inner" style={innerStyle}>
        <img src={src} alt={alt} draggable={false} />
      </div>
    </div>
  );
}
