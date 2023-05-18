import axios from "axios";

async function main() {
    const data = await axios
        .get("https://ceedri.ch/media/Home/Bin_Man.JPG")
        .then((res) => res.data)
        .catch((err) => console.log("err"));
    console.log(data);
}

main();
