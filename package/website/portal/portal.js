class App {
  constructor() {
    this.file_handler = new FileHandler()
    this.api_handler = new ApiHandler();
    window.addEventListener("DOMContentLoaded", () => {
      this.ui_handler = new UiHandler();
    });
  }
}

class FileHandler {
  CreateBinaryString(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function () {
        let arrayBuffer = this.result,
          array = new Uint8Array(arrayBuffer),
          binaryString = String.fromCharCode.apply(null, array);

        resolve(array);
      };
      reader.readAsArrayBuffer(file);
    })

  }
}

class ApiHandler {
  constructor() {
    (async () => {
      this.init(true);
    })();
    this.data_refresh_interval = 5000;
  }
  init = async (use_storage = false) => {
    try {
      if (use_storage) {
        this.company_data = JSON.parse(localStorage.getItem("company_data"));
        app.ui_handler.UpdateUi(this.company_data);
      } else {
        throw new Error("Don't use storage to fetch company data.");
      }
    } catch {
      const company_data = await this.GetCompanyData();
      this.company_data = company_data;
      localStorage.setItem("company_data", JSON.stringify(this.company_data));
      app.ui_handler.UpdateUi(this.company_data);
    }
    setTimeout(this.init, this.data_refresh_interval);
  };
  GetCompanyData = async () => {
    try {
      const response = await fetch("/data");
      const data = await response.json();
      return data;
    } catch (err) {
      console.error(err);
    }
  };
  UploadFile = async (json_obj) => {
    const response = await fetch("/file", {
      method: "POST",
      body: json_obj
    })
    response
  }
}

class UiHandler {
  constructor() {
    this.UpdateUi();

    const upload_btn = document.querySelector(".upload_btn");
    upload_btn.addEventListener("click", this.OpenModal);
  }
  SubmitClickCallback() {
    app.ui_handler.SubmitClicked();
  }
  OpenModal() {
    const upload_modal = document.querySelector(".upload_modal");
    upload_modal.classList.remove("d-none");

    const submit_btn = document.querySelector(".submit_btn");

    submit_btn.addEventListener("click", app.ui_handler.SubmitClickCallback, {
      once: true,
    });
  }
  async SubmitClicked() {
    const file_input = document.querySelector("#file_input");
    const file_input_name = document.querySelector('#file_name_input');
    app.file_handler.CreateBinaryString(file_input.files[0]).then(file_binary_string => {
      const tranmission_obj = {
        name: `${file_input_name.value}`,
        binaryString: file_binary_string
      }
      const json_obj = JSON.stringify(tranmission_obj);
      console.log(json_obj)

      // send data to server
      app.api_handler.UploadFile(json_obj)

      // temp
      this.CloseModal();
    })

  }
  CloseModal() {
    const upload_modal = document.querySelector(".upload_modal");
    upload_modal.classList.add("d-none");

    const submit_btn = document.querySelector(".submit_btn");
    submit_btn.removeEventListener(
      "click",
      app.ui_handler.SubmitClickCallback,
      {
        once: true,
      }
    );
  }
  UpdateUi(company_data = app.api_handler.company_data) {
    const company_name_text = document.querySelector("#company_name");
    company_name_text.textContent = company_data?.name ?? "Secure Chain";
    if (company_data?.logo?.data) {
      let blob = new Blob([
        new Uint8Array([...company_data?.logo?.data]).buffer,
      ]);
      document.querySelector(".navbar_logo").src = URL.createObjectURL(blob);
    }
  }
}

const app = new App();
