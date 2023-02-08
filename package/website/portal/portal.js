class App {
  constructor() {
    this.data_retrieval_refresh_rate = 5000;
    this.file_handler = new FileHandler();
    this.api_handler = new ApiHandler();
    window.addEventListener("DOMContentLoaded", () => {
      this.ui_handler = new UiHandler();
    });
    this.user_data;
  }
}

class FileHandler {
  CreateBinaryString(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function () {
        let arrayBuffer = this.result,
          array = new Uint8Array(arrayBuffer);
        // binaryString = String.fromCharCode.apply(null, array);

        resolve(array);
      };
      reader.readAsArrayBuffer(file);
    });
  }
  async DownloadFile(file_id) {
    const response = await app.api_handler.RequestFileData(file_id);
    const file_byte_arr = JSON.parse(response.file_data);
    // const buffer = new Uint8Array(file_byte_arr);
    const buffer = new ArrayBuffer(Object.entries(file_byte_arr).length);
    const view = new Uint8Array(buffer);
    const file_data_entries = Object.entries(file_byte_arr);
    for (const i in file_data_entries) {
      view[i] = file_data_entries[i][1];
    }
    const blob = new Blob([view], {
      type: response.type,
    });
    const link = document.createElement("a");
    // link.target = "_blank";
    link.href = window.URL.createObjectURL(blob);
    link.download = `${response.fileName}`;
    link.click();

  }
}

class ApiHandler {
  constructor() {
    (async () => {
      this.init(true);
    })();
    this.data_refresh_interval = 5000;
  }
  // recursive using timeouts
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
      // const file_data = await this.GetFileMetaData();
      localStorage.setItem("company_data", JSON.stringify(this.company_data));
      app.ui_handler.UpdateUi(this.company_data);
    }
    setTimeout(this.init, this.data_refresh_interval);
  };
  GetFileMetaData = async () => {
    const response = await fetch("/fileMeta");
    if (response.status == 200) {
      const data = await response.json();
      return data;
    } else {
      if (response.status == 401) {
        window.location.reload();
      } else return [];
    }
  };
  RequestFileData = async (file_id, user_id) => {
    const response = await fetch(`/filedata?file_id=${file_id}`);
    if (response.status == 200) {
      const data = await response.json();
      return data;
    } else {
      if (response.status == 401) {
        window.location.reload();
      } else return [];
    }
  };
  // used within init
  GetCompanyData = async () => {
    try {
      const response = await fetch("/data");
      if (response.status == 401) {
        window.location.reload();
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.error(err);
    }
  };
  //uploads file to server
  UploadFile = async (json_obj) => {
    const body = {
      file: JSON.stringify(json_obj),
      dateTime: new Date().toLocaleString(),
    };
    const response = await fetch("/file", {
      method: "POST",
      body: JSON.stringify(body),
    });
    response;
  };
}

class UiHandler {
  constructor() {
    this.InitialiseUI();
    this.UpdateUi();
    this.displayed_files_string

  }

  InitialiseUI() {
    const DisplayHomeContent = () => {
      // log out functionality
      const log_out_div = document.querySelector('.log_out_div');
      log_out_div.addEventListener('click', () => {
        // document.cookie = "test"
        document.cookie.split(';').forEach(function (c) {
          if (document.cookie = c.trim().split('=')[0] == "session_token") {
            document.cookie = c.trim().split('=')[0] + '=;' + 'expires=Thu, 01 Jan 1970 00:00:00 UTC;';
          }
        });
        window.location.reload()
      })


      const folder_view = document.querySelector(".folder_view");
      folder_view.innerHTML = "";

      folder_view.innerHTML = `
      <div class="home_buttons">
        <div class="home_upload_btn" id="home_upload_btn">
          <span>Upload</span>
          <div class="upload_img_div"></div> 
        </div>
      </div>
        <div class="home_recent_header">Recent</div>
        <div class="recent_files_div">
      </div>`;

      const home_upload_btn = folder_view.querySelector(".home_upload_btn");
      home_upload_btn.addEventListener("click", this.OpenModal);

      const viewer_header = document.querySelector(".viewer_header");
      viewer_header.textContent = "Home";

      const recent_files_div = folder_view.querySelector(".recent_files_div");
      this.UpdateFileDisplay(recent_files_div);

      // auto refresh
      setInterval(() => this.UpdateFileDisplay(recent_files_div), 5000);
    };

    const explorer_links = document.querySelector(".explorer_body_links");
    explorer_links.innerHTML = `
    <ul>
        <li class="active" id="home_link">Home</li>
        <li id="files_link">Files</li>
        <li id="recent_link">Recent</li>
    </ul>`;

    const home_link = explorer_links.querySelector("#home_link");
    home_link.addEventListener("click", DisplayHomeContent);

    // Home by default
    home_link.click();
  }
  //updates UI files
  async UpdateFileDisplay(parent) {

    // const folder_view = document.querySelector(".folder_view");
    // parent.innerHTML = "";
    const recent_file_limit = 5
    const new_files = JSON.stringify(app.api_handler.company_data.files)
    if (this.displayed_files != new_files) {
      parent.innerHTML = "";
      let files = app.api_handler.company_data.files;
      this.displayed_files = JSON.stringify(files)
      files = files.sort((a, b) => {
        const a_date = new Date(a.timeStamp)
        const b_date = new Date(b.timeStamp)

        return b_date - a_date
        // console.log(a)
      })

      let limit_reached = false
      files.forEach((fileMeta, index) => {
        if (limit_reached) {
          return
        }
        else if (index < recent_file_limit) {
          const file_date = new Date(fileMeta.timeStamp);
          const date_string = `${file_date.toLocaleDateString()} ${file_date.toLocaleTimeString()}`;

          const file_div = document.createElement("div");
          file_div.classList.add("file_div");
          file_div.innerHTML = `
          <div class="file_icon_div"></div>
          <div class="file_text">
            <div class="file_left">
              <div class="file_name_desc">
                <div class="file_meta_name">
                    ${fileMeta.fileName}
                  </div>
                  <div class="file_meta_desc">
                    ${fileMeta.description}
                  </div>
              </div>
              <div class="hover_section"></div>
            </div>
            <div class="file_right">
              <div class="additional_meta">Uploaded at: ${date_string} by ${fileMeta.uploaded_by}</div>
            </div>
          </div>
          `;
          parent.append(file_div);

          const hover_section = file_div.querySelector(".hover_section");

          file_div.addEventListener("mouseenter", () => {
            hover_section.innerHTML = `
        ${app.api_handler.company_data.user_data.Permission_Level < 3 ?
                `<div class="download_button"></div>`
                : ""}
        <div class="view_button"></div>
        `;

            const download_button = hover_section.querySelector(".download_button");
            if (download_button) {
              download_button.addEventListener("click", (e) => {
                // console.log(e);
                app.file_handler.DownloadFile(fileMeta.file_ID);
              });
            }

          });

          file_div.addEventListener("mouseleave", () => {
            hover_section.innerHTML = "";
          });
        }
        else {
          // add see more files button here
          const see_more_div = document.createElement("div");
          // see_more_div.classList.add("");
          see_more_div.innerHTML = `
          <div class="more_files_btn">View more files</div>
          `;
          parent.append(see_more_div);
          limit_reached = true
        }

      });
    }
  }
  // callback for submit button event listener
  SubmitClickCallback() {
    app.ui_handler.SubmitClicked();
  }
  //opens modal
  OpenModal() {
    const upload_modal = document.querySelector(".upload_modal");
    upload_modal.classList.remove("d-none");

    const submit_btn = document.querySelector(".submit_btn");

    const close_btn = document.querySelector(".close_btn");
    close_btn.addEventListener("click", () => {
      app.ui_handler.CloseModal();
    });

    submit_btn.addEventListener("click", app.ui_handler.SubmitClickCallback, {
      once: true,
    });
  }
  // executed once submit button is clicked
  async SubmitClicked() {
    const file_input = document.querySelector("#file_input");
    const file_input_name = document.querySelector("#file_name_input");
    const file_input_desc = document.querySelector("#file_description_input");
    if (file_input.files.length > 0) {
      app.file_handler
        .CreateBinaryString(file_input.files[0])
        .then((file_binary_string) => {
          let new_name = file_input_name.value;
          new_name += `.${file_input.files[0].name.split(".")[1]}`;
          const tranmission_obj = {
            name: `${new_name}`,
            type: `${file_input.files[0].type}`,
            size: `${file_input.files[0].size}`,
            description: file_input_desc?.value ?? "",
            binaryString: file_binary_string,
            timeStamp: new Date().toISOString(),
          };
          const json_obj = JSON.stringify(tranmission_obj);
          console.log(json_obj);

          // send data to server
          app.api_handler.UploadFile(json_obj);

          // temp
          this.CloseModal();
        });
    } else {
      this.CloseModal();
    }
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
