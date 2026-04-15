export function NightsIcon({nights} : {nights: boolean}){
    return(
    <>{nights ? 'Nights' : 'D'}</>
    );
}


export function PriorityIcon({priority} : {priority: boolean}){
    return(
    <>{priority ? 'PRIO' : '\u00A0'}</>
    );
}

export function TypeIcon({type} : {type: string}){
    return(
    <>{type}</>
    );
}