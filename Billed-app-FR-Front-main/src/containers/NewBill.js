import { ROUTES_PATH } from "../constants/routes.js";
import Logout from "./Logout.js";

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const formNewBill = this.document.querySelector(
      `form[data-testid="form-new-bill"]`
    );
    formNewBill.addEventListener("submit", this.handleSubmit);
    const file = this.document.querySelector(`input[data-testid="file"]`);
    file.addEventListener("change", this.handleChangeFile);
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;
    new Logout({ document, localStorage, onNavigate });
  }

  // BUG #3
  // Handle change event for file input
  handleChangeFile = (e) => {
      e.preventDefault(); // Prevent default form submission behavior
  
      // Get the file input element
      const fileInput = this.document.querySelector(`input[data-testid="file"]`);
      const file = fileInput.files[0]; // Get the selected file
  
      if (!file) {
        // Handle case where no file is selected
        return;
      }
  
      // Check if the file is an image
      const isPicture = (mimeType) =>
        ["image/jpeg", "image/jpg", "image/png", "image/gif"].includes(mimeType);
  
      if (!isPicture(file.type)) {
        // Handle case where the selected file is not an image
        const errorElement = document.createElement("div");
        errorElement.textContent =
          "Le fichier sélectionné n'est pas une image. Veuillez sélectionner un fichier image (JPEG, JPG, PNG, GIF).";
        errorElement.style.color = "red";
  
        // Display the error message
        fileInput.parentNode.appendChild(errorElement);
  
        // Reset the file input to allow selecting a new file
        fileInput.value = "";
  
        return;
      }
  
      // Extract the file name from the file path
      const filePath = e.target.value.split(/\\/g);
      const fileName = filePath[filePath.length - 1];
  
      // Create a new FormData object
      const formData = new FormData();
  
      // Get user's email from local storage and append it to the form data
      const email = JSON.parse(localStorage.getItem("user")).email;
      formData.append("file", file);
      formData.append("email", email);
  
      // Send the form data to the server to create a new bill
      this.store
        .bills() // Access the bills resource
        .create({  // Create a new bill
          data: formData,  // Set the form data as the request payload
          headers: {  // Provide additional headers for the request
            noContentType: true,  // Specify that the request has no content type
          },
        })
        .then(({ fileUrl, key }) => {  // Handle successful response
          console.log(fileUrl);  // Log the file URL
          this.billId = key;  // Set the bill ID
          this.fileUrl = fileUrl;  // Set the file URL
          this.fileName = fileName;  // Set the file name
        })
        .catch((error) => console.error(error));  // Handle error response
    };
    
  handleSubmit = (e) => {
    e.preventDefault();
    console.log(
      'e.target.querySelector(`input[data-testid="datepicker"]`).value',
      e.target.querySelector(`input[data-testid="datepicker"]`).value
    );
    const email = JSON.parse(localStorage.getItem("user")).email;
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(
        e.target.querySelector(`input[data-testid="amount"]`).value
      ),
      date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct:
        parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) ||
        20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`)
        .value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: "pending",
    };
    this.updateBill(bill);
    this.onNavigate(ROUTES_PATH["Bills"]);
  };

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH["Bills"]);
        })
        .catch((error) => console.error(error));
    }
  };
}
