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
    this.body = document.querySelector('body')
    const log_in_btn = document.querySelector('#log_in_btn');
    const log_in_toggle_modal_btn = document.querySelector('#log_in_toggle_modal_btn')
    log_in_btn.addEventListener("click", () => {
      this.ClearLogInModal();
      log_in_toggle_modal_btn.click();
    })

    const log_in_form = document.querySelector('.log_in_form');
    log_in_form.addEventListener('click', (event) => {
      event.preventDefault();
      log_in_toggle_modal_btn.click();
    })
    //#endregion

    this.UpdateUi()
  }
  ClearLogInModal() {
    document.querySelector('#username_input').value = ""
    document.querySelector('#password_input').value = ""
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


