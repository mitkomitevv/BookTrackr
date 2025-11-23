import Hero from "./Hero";
import StaffRecommendations from "./StaffRecommendations";
import PickOfMonth from "./PickOfMonth";

export default function Home() {
    return (
        <main className="flex-1">
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
                <Hero />
                <StaffRecommendations />
                <PickOfMonth />
            </div>
        </main>
    );
}
