const asym_crypto = window.asym_crypto;
class App {
  constructor() {
    this.api_handler = new ApiHandler();
    window.addEventListener("DOMContentLoaded", () => {
      this.ui_handler = new UiHandler();
    });
  }
}

class UiHandler {
  constructor() {
    //#region Event Listeners
    const log_in_form = document.querySelector(".log_in_form");
    const username_input = document.querySelector("#username_input");
    const error_message = document.querySelector(".error_message");
    const create_new_account_div = document.querySelector(
      ".create_new_account_div"
    );

    log_in_form.addEventListener("submit", async function (event) {
      event.preventDefault();
      const username = username_input.value;
      const password = password_input.value;
      if (username != "" && username != undefined) {
        if (password.length >= 5) {
          const log_in_response = await app.api_handler.LogIn(
            username,
            password
          );
          if (log_in_response?.successful) {
            const cookie_string = log_in_response.token.toString();

            const d = new Date();
            const hours = 2;
            d.setTime(d.getTime() + hours * 60 * 60 * 1000);
            let expires = "expires=" + d.toUTCString();

            document.cookie = `session_token=${cookie_string}; ${expires}; path="${window.location.pathname}"`;
            window.location.reload();
          } else {
            // log in auth unsuccessful
            // display stuff
            error_message.textContent = "Incorrect username or password.";
            password_input.value = "";
            username_input.value = "";
          }
        } else {
          error_message.textContent = "Password must be over 5 characters.";
        }
      } else {
        error_message.textContent = "Enter a valid username.";
      }
    });

    const show_password_btn = document.querySelector(".show_password_btn");
    show_password_btn.addEventListener("mousedown", () => {
      show_password_btn.classList.add("close_eye");
      password_input.type = "text";
    });

    show_password_btn.addEventListener("mouseup", () => {
      show_password_btn.classList.remove("close_eye");
      password_input.type = "password";
    });

    show_password_btn.addEventListener("mouseleave", () => {
      show_password_btn.classList.remove("close_eye");
      password_input.type = "password";
    });

    create_new_account_div.addEventListener("click", () => {
      const modal_pop_up = document.querySelector(".modal_pop_up");

      modal_pop_up.classList.remove("d-none");

      modal_pop_up.innerHTML = `
              <div class="inner_modal_overlay">
                    <div class="modal_title">
                      <span>Register account</span>
                    </div>
                    <div class="log_in_div">
                    <div class="register_form_input_div">
                            <label class="input_label">Enter name</label>
                            <input type="text" class="log_in_input" id="register_name_input" placeholder="Enter name">
                        </div>
                        <div class="register_form_input_div">
                            <label class="input_label">Create username</label>
                            <input type="text" class="log_in_input" id="register_username_input" placeholder="Enter username">
                        </div>
                        <div class="register_form_input_div">
                            <label class="input_label">Create password</label>
                            <div class="password_div">
                                <input type="password" class="log_in_input" id="init_password_input"
                                    placeholder="Enter password" value="">
                                <div class="show_init_password_btn show_password_btn open_eye">
                                </div>
                            </div>
                        </div>
                        <div class="register_form_input_div">
                            <label class="input_label">Re-enter password</label>
                            <div class="password_div">
                                <input type="password" class="log_in_input" id="repeat_password_input"
                                    placeholder="Enter password" value="">
                                <div class="show_password_btn show_repeat_password_btn open_eye">
                                </div>
                            </div>
                        </div>
                        <span class="error_message register_error_message text-danger text-sm"></span>
                    </div>
                    <div class="register_btn_div">
                        <button class="register_btn" type="submit">Register account</button>
                    </div>
              </div>`;

      // password visibility toggle
      {
        const show_password_btn = modal_pop_up.querySelector(
          ".show_init_password_btn"
        );

        const init_password_input = document.querySelector(
          "#init_password_input"
        );

        show_password_btn.addEventListener("mousedown", () => {
          show_password_btn.classList.add("close_eye");
          init_password_input.type = "text";
        });

        show_password_btn.addEventListener("mouseup", () => {
          show_password_btn.classList.remove("close_eye");
          init_password_input.type = "password";
        });

        show_password_btn.addEventListener("mouseleave", () => {
          show_password_btn.classList.remove("close_eye");
          init_password_input.type = "password";
        });
      }

      {
        const show_password_btn = modal_pop_up.querySelector(
          ".show_repeat_password_btn"
        );

        const init_password_input = document.querySelector(
          "#repeat_password_input"
        );

        show_password_btn.addEventListener("mousedown", () => {
          show_password_btn.classList.add("close_eye");
          init_password_input.type = "text";
        });

        show_password_btn.addEventListener("mouseup", () => {
          show_password_btn.classList.remove("close_eye");
          init_password_input.type = "password";
        });

        show_password_btn.addEventListener("mouseleave", () => {
          show_password_btn.classList.remove("close_eye");
          init_password_input.type = "password";
        });
      }

      const register_btn = modal_pop_up.querySelector(".register_btn");
      register_btn.addEventListener("click", async () => {
        const GenerateKeyPair = async () => {
          // Node RSA library - https://www.npmjs.com/package/node-rsa

          const Format = (key, type = "public") => {
            var bound = `-----`;
            var split_1 = key.split(`${bound}\n`);
            var split_2 = split_1[1].split(`\n${bound}`);
            // var lower_bound = `\n-----END ${type.toUpperCase()} KEY-----`;
            // var split = key.split(upper_bound);
            // var split_2 = split[1].split(lower_bound);
            const _key = split_2[0];
            return _key;
          };
          const key = new window.rsa({ b: 512 });
          const pair = key.generateKeyPair();
          const publicKey = pair.exportKey(["public"]);
          const privateKey = pair.exportKey(["private"]);

          return {
            publicKey: Format(publicKey, "public"),
            privateKey: Format(privateKey, "private"),
          };

          // private key to be symetrically encrypted by password.
        };

        // register clicked
        const error_message_span = document.querySelector(
          ".register_error_message"
        );

        const name_input = modal_pop_up.querySelector("#register_name_input");
        const username_input = modal_pop_up.querySelector(
          "#register_username_input"
        );
        const password_one = modal_pop_up.querySelector("#init_password_input");
        const password_two = modal_pop_up.querySelector(
          "#repeat_password_input"
        );

        const EncryptKey = async (key, passphrase) => {
          const hashed_passphrase = CryptoJS.SHA256(passphrase).toString();
          const bytes = await CryptoJS.AES.encrypt(
            key.toString(),
            hashed_passphrase
          );
          var encryptedData = bytes.ciphertext.toString();
          return encryptedData;
        };

        const DecryptKey = async (encryped_key, passphrase) => {
          const hashed_passphrase = CryptoJS.SHA256(passphrase).toString();
          const bytes = await CryptoJS.AES.decrypt(
            encryped_key.toString(),
            hashed_passphrase
          );
          var decryptedData = bytes.toString(CryptoJS.enc.Base64);
          return decryptedData;
        };

        // check to see if fields are valid
        if (name_input.value != "" && username_input.value != undefined) {
          if (username_input.value != "" && username_input.value != undefined) {
            if (password_one.value != "" && password_one.value != undefined) {
              if (password_one.value.length >= 5) {
                if (password_one.value == password_two.value) {
                  const KeyPair = await GenerateKeyPair();

                  // const hashed_passphrase = CryptoJS.SHA256(
                  //   password_one.value
                  // ).toString();

                  // var message_to_encrypt = KeyPair.privateKey;

                  // AES

                  // // Encrypt
                  // var encrypted = CryptoJS.AES.encrypt(
                  //   message_to_encrypt,
                  //   hashed_passphrase
                  // );

                  // // Decrypt
                  // var decrypted = CryptoJS.AES.decrypt(
                  //   encrypted.toString(),
                  //   hashed_passphrase
                  // );
                  // var decryptedstring = decrypted.toString(CryptoJS.enc.Utf8);

                  app.api_handler
                    .Register(
                      name_input.value,
                      username_input.value,
                      password_one.value
                    )
                    .then((response) => {
                      if (response == 200) {
                        window.location.reload();
                      } else {
                        error_message_span.textContent = response.message;
                      }
                    });
                } else {
                  error_message_span.textContent = "Passwords do not match.";
                }
              } else {
                error_message_span.textContent =
                  "Password must be 5 characters or more.";
              }
            } else {
              error_message_span.textContent = "Invalid password.";
            }
          } else {
            error_message_span.textContent = "Invalid username.";
          }
        } else {
          error_message_span.textContent = "Invalid name.";
        }
      });
    });
    //#endregion
    this.UpdateUi();
  }

  UpdateUi(company_data = app.api_handler.session_data) {
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

class ApiHandler {
  constructor() {
    this.init();
  }
  async init() {
    try {
      this.company_data = JSON.parse(localStorage.getItem("company_data"));
      app.ui_handler.UpdateUi(this.company_data);
    } catch {}
    this.company_data = await this.GetCompanyData();
    localStorage.setItem("company_data", JSON.stringify(this.company_data));
    app.ui_handler.UpdateUi(this.company_data);
  }
  async GetCompanyData() {
    try {
      const response = await fetch("/company_data");
      const data = await response.json();
      return data;
    } catch (err) {
      console.error(err);
    }
  }
  async LogIn(username, password) {
    try {
      const response = await fetch("/login", {
        type: "POST",
        headers: {
          username: username,
          password: password,
        },
      });
      const data = await response.json();
      console.log(response.headers);
      return data;
    } catch (err) {}
  }
  async Register(name, username, password) {
    // if registration is successful, return 200
    // else return with error message

    try {
      const response = await fetch("/register", {
        type: "GET",
        headers: {
          name: name,
          username: username,
          password: password,
        },
      });
      const data = await response.json();
      console.log(response.headers);
      return data;
    } catch (err) {}

    return "Not implemented";
  }
}

const app = new App();
