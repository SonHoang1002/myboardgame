
import { ToastContainer } from 'react-toastify';
import './App.css';
import MyRoutes from './app/routers/MyRoutes';
import "./index.css";
import { ContextTheme } from './app/providers/ThemeContext';
import { useContext, useState } from 'react';
import { LocalDataInterface, ContextLocalData } from './app/providers/LocalDataContext';
import { UserEntity } from './entities/UserEntity';

function App() {
  const [isDark, setTheme] = useState<boolean>(true)
  const [localData, setLocalData] = useState<LocalDataInterface | null>(null)

  const onChangeTheme = () => {
    setTheme((prev) => !prev);
  }

  const onChangeLocalData = (newData: Partial<LocalDataInterface>) => {
    console.log("onChangeLocalData ", newData)
    setLocalData(prev => {
      if (!prev) {
        // Nếu chưa có data, tạo mới với các giá trị mặc định
        return {
          accessToken: newData.accessToken || '',
          refreshToken: newData.refreshToken || '',
          user: newData.user || {} as UserEntity,
          onUpdateUser: () => { },
          onUpdateAccessToken: () => { },
          onUpdateRefreshToken: () => { },
          onUpdateAll: () => { },
        };
      }
      return { ...prev, ...newData };
    });
  }


  const contextValue: LocalDataInterface = {
    accessToken: localData?.accessToken || '',
    refreshToken: localData?.refreshToken || '',
    user: localData?.user || {} as UserEntity,
    onUpdateUser: (user: UserEntity) => onChangeLocalData({ user }),
    onUpdateAccessToken: (accessToken: string) => onChangeLocalData({ accessToken }),
    onUpdateRefreshToken: (refreshToken: string) => onChangeLocalData({ refreshToken }),
    onUpdateAll: (data: Partial<LocalDataInterface>) => onChangeLocalData(data),
  };


  return (
    <>
      <ContextTheme.Provider value={{ isDark: isDark, toggle: onChangeTheme, }}>
        <ContextLocalData.Provider value={contextValue}>
          <MyRoutes />
          <ContextDebugger />
        </ContextLocalData.Provider>
        <ToastContainer position="bottom-right" autoClose={1500} />
      </ContextTheme.Provider>
    </>
  );
}


const ContextDebugger = () => { 
  const localDataContext = useContext<LocalDataInterface | null>(ContextLocalData);

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.8)',
      color: '#fff',
      padding: '10px',
      fontSize: '12px',
      fontFamily: 'monospace',
      maxHeight: '200px',
      overflow: 'auto',
      pointerEvents: 'none' // Cho phép click xuyên qua
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, marginLeft: '20px' }}>
          <strong>LocalData Context:</strong>
          <pre style={{ margin: '5px 0', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(localDataContext, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default App;
