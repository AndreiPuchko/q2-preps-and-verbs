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

home_page.add_control("label", "", {
    control: "widget",
    data: {
        widget: OneWordTrainer,
        props: { data: trainer_data }
    }
})
