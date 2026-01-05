import { useContext, useState } from "react";
import { Settings, User } from "lucide-react";
import { ContextLocalData, LocalDataInterface } from "../../../app/providers/LocalDataContext";

const tabs = ["Dashboard", "Game Modes", "Cards", "Rules", "History"];

const HomeHeader = () => {
  const [active, setActive] = useState("Dashboard");
  const appData = useContext<LocalDataInterface | null>(ContextLocalData)

  return (
    <header
      className="
        w-full 
        h-16 
        bg-slate-900 
        border-b border-slate-700 
        px-4 md:px-6 
        flex items-center justify-between 
        text-white
        sticky top-[10px] z-50  /* MAKE HEADER STICKY */
      "
    >
      {/* LEFT: LOGO */}
      <div className="text-lg md:text-xl font-bold tracking-wide select-none">
        Exploding Cat
      </div>

      {/* CENTER: TABS */}
      <nav className="hidden md:flex items-center gap-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`
              relative py-2 text-sm font-medium transition
              ${active === tab ? "text-blue-400" : "text-slate-300 hover:text-white"}
            `}
          >
            {tab}

            {active === tab && (
              <span className="absolute left-0 -bottom-1 w-full h-[2px] bg-blue-500 rounded-full"></span>
            )}
          </button>
        ))}
      </nav>

      {/* RIGHT: SETTINGS + ACCOUNT */}
      <div className="flex items-center gap-3 md:gap-4">
        <button className="p-2 rounded-lg hover:bg-slate-800 transition">
          <Settings size={20} />
        </button>

        <button className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition">
          <User size={18} />
          <span className="text-sm">{appData?.user?.nameInGame}</span>
        </button>
      </div>
    </header>
  );
};


export default HomeHeader;
