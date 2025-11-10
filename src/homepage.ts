import { Q2Form } from "q2-web"
import { OneWordTrainer } from "./components/one-word-trainer"
import { trainer_data } from './trainer-data'

export const home_page = new Q2Form("", "", "teacher_home");
home_page.frameless = true;
home_page.resizeable = false;
home_page.moveable = false;
home_page.width = "100%";
home_page.height = "100%";
home_page.add_control("/h");

const params = new URLSearchParams(window.location.search);
let url = params.get("dataset");
let dataset = [];
// url = "?dataset=https://raw.githubusercontent.com/AndreiPuchko/q2-preps-and-verbs/refs/heads/main/public/data2.json"
if (url) {
    try {
        const response = await fetch(url);
        if (response.ok) {
            dataset = (await response.json());
        }
    }
    finally { }
}

if (dataset.length === 0) {
    dataset = trainer_data
}
home_page.add_control("label", "", {
    control: "widget",
    data: {
        widget: OneWordTrainer,
        props: { data: dataset }
    }
})
