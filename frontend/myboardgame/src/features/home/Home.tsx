import HomeHeader from "./component/HomeHeader";

const Home = () => {
    return <>
        <div className="w-screen h-screen flex justify-center items-start">
            <div className="w-[90%] md:w-[80%]">
                <HomeHeader />
            </div>
        </div>
    </>;
};

export default Home;


