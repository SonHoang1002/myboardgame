


export interface Game {
    // Id game ( tự tạo )
    gameId: string;

    // Id phòng ( tự tạo )
    roomId: string;

    // Danh sách những thẻ bài chưa được sử dụng
    activeDeck: string[];

    // Danh sách những thẻ bài đã được sử dụng
    inActiveDeck: string[];
    
    // Hướng chu kỳ của game 
    turnCicleClock: boolean;

    currentPlayerId: string,

    // những người chơi ( người đang tham gia vào trò chơi )
    activePlayerIds: string[];

    // những người chơi ( người đã thua trong trò chơi )
    inActivePlayerIds: string[];

    // Danh sách người xem trong trò chơi
    observerPlayerIds: string[]

    gameMode: string, 

    status: GameStatus,
}


export enum GameStatus {
    WAITING, ACTIVE, FINISHED
}