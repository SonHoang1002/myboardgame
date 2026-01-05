enum GameAction {
    ATTACK,
    DEFUSE,
    EXPLODING_KITCHEN,
    FAVOR,
    NOPE,
    SEE_FUTURE_3,
    SEE_FUTURE_5,
    ALTER_FUTURE_3,
    ALTER_FUTURE_5,
    SHUFFLE,
    SKIP,

}

interface ActionOpposition {
    sendedUserId: string;
    receivedUserId: string;
}
interface ActionSingle {
    sendedUserId: string;
    receivedUserId: string;
}

export interface ActionAttackData extends ActionOpposition {

}
export interface ActionDefure extends ActionSingle {

}

export interface ActionExplodingKitchen extends ActionSingle {

}
export interface ActionFavor extends ActionOpposition {

}
export interface ActionNope extends ActionOpposition {

}

export interface ActionSeeFuture3 extends ActionOpposition {

}

export interface ActionSeeFuture5 extends ActionOpposition {

}

export interface ActionAlterFuture3 extends ActionOpposition {

}

export interface ActionAlterFuture5 extends ActionOpposition {

}

export interface ActionShuffle extends ActionSingle {

}

export interface ActionSkip extends ActionSingle {

}





