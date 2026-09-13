export const profileController = {
    async getSoloProfile() {
        // Temporary mock. Replace with DB lookup when available.
        return {
            player: "Ananya Chaudhary",
            date: "19 SEPTEMBER 2026",
            email: "abc@gmail.com",
            timeslot: "10:00 - 10:15 AM",
            regNo: "25BCE0111",
            phone: "9863547243",
        };
    },
    async getTeamProfile() {
        // Temporary mock. Replace with DB lookup when available.
        return {
            team_code: "CUDHEF",
            members: [
                { name: "Rishan Sharma", regNo: "25BAI0763" },
                { name: "Ananya Chaudhary", regNo: "25BCE0111" },
                { name: "Priya Singh", regNo: "25CSE0456" },
                { name: "Karan Patel", regNo: "25EEE0234" },
                { name: "Sneha Rao", regNo: "25MEC0999" },
            ],
        };
    },
};

export const profileService = profileController;
