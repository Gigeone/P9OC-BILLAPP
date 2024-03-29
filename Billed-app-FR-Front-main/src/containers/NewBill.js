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
  //La fonction gère le processus de sélection d'un fichier par l'utilisateur, vérifie s'il s'agit d'une image, puis envoie ce fichier au serveur avec d'autres données pour créer une nouvelle facture.
  handleChangeFile = (e) => {
      e.preventDefault(); // Empêche le comportement par défaut de soumission du formulaire
  
       // Récupère l'élément d'entrée de fichier
      const fileInput = this.document.querySelector(`input[data-testid="file"]`);
      const file = fileInput.files[0]; // Récupère le fichier sélectionné
  
      if (!file) {
        // Gère le cas où aucun fichier n'est sélectionné
        return;
      }
  
      // Fonction vérifiant si le fichier est une image
      const isPicture = (mimeType) =>
        ["image/jpeg", "image/jpg", "image/png", "image/gif"].includes(mimeType);
  
      if (!isPicture(file.type)) {
        // Gère le cas où le fichier sélectionné n'est pas une image
        const errorElement = document.createElement("div");
        errorElement.textContent =
          "Le fichier sélectionné n'est pas une image. Veuillez sélectionner un fichier image (JPEG, JPG, PNG, GIF).";
        errorElement.style.color = "red";
  
        // Affiche le message d'erreur
        fileInput.parentNode.appendChild(errorElement);
  
        // Réinitialise l'entrée de fichier pour permettre la sélection d'un nouveau fichier
        fileInput.value = "";
  
        return;
      }
  
     // Extrait le nom du fichier du chemin du fichier
      const filePath = e.target.value.split(/\\/g);
      const fileName = filePath[filePath.length - 1];
  
      // Crée un nouvel objet FormData
      const formData = new FormData();
  
      // Récupère l'e-mail de l'utilisateur depuis le stockage local et l'ajoute aux données du formulaire
      const email = JSON.parse(localStorage.getItem("user")).email;
      formData.append("file", file);
      formData.append("email", email);
  
      // Envoie les données du formulaire au serveur pour créer une nouvelle facture
      this.store
        .bills() // Accède à la ressource des factures
        .create({   // Crée une nouvelle facture
          data: formData,  // Définit les données du formulaire comme charge utile de la requête
          headers: {  // Fournit des en-têtes supplémentaires pour la requête
            noContentType: true,   // Indique que la requête n'a pas de type de contenu
          },
        })
        .then(({ fileUrl, key }) => {  // Handle successful response
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
