class App {
  constructor() {
    this.api_handler = new ApiHandler()
    window.addEventListener("DOMContentLoaded", () => {
      this.ui_handler = new UiHandler();
    })
  }
}

class UiHandler {
  constructor() {
    //#region Event Listeners
    const log_in_form = document.querySelector(".log_in_form")
    const username_input = document.querySelector('#username_input')
    const password_input = document.querySelector('#password_input')
    log_in_form.addEventListener("submit", function (event) {
      event.preventDefault();
      const username = username_input.value;
      const password = password_input.value;
    })

    const show_password_btn = document.querySelector('.show_password_btn')
    show_password_btn.addEventListener("mousedown", () => {
      show_password_btn.classList.add("close_eye")
      password_input.type = "text"
    })

    show_password_btn.addEventListener("mouseup", () => {
      show_password_btn.classList.remove("close_eye")
      password_input.type = "password"

    })

    show_password_btn.addEventListener("mouseleave", () => {
      show_password_btn.classList.remove("close_eye")
      password_input.type = "password"

    })
    //#endregion
    this.UpdateUi()
  }

  UpdateUi(company_data = app.api_handler.company_data) {
    const company_name_text = document.querySelector('#company_name');
    company_name_text.textContent = company_data?.name ?? "Secure Chain"
    let blob = new Blob([new Uint8Array([...company_data?.logo?.data]).buffer]);
    document.querySelector('.navbar_logo').src = URL.createObjectURL(blob);
  }
}

class ApiHandler {
  constructor() {
    this.init()
  }
  async init() {
    try {
      this.company_data = JSON.parse(localStorage.getItem("company_data"))
      app.ui_handler.UpdateUi(this.company_data)
    }
    catch { }
    this.company_data = await this.GetCompanyData();
    localStorage.setItem("company_data", JSON.stringify(this.company_data))
    app.ui_handler.UpdateUi(this.company_data)
  }
  async GetCompanyData() {
    try {
      const response = await fetch("/data")
      const data = await response.json();
      return data;
    }
    catch (err) {
      console.error(err)
    }
  }
}

const app = new App()
