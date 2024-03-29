/**
 * @jest-environment jsdom
 */
import MockedStore from "../__mocks__/store";
import { screen, waitFor, fireEvent } from "@testing-library/dom";
import Bills from "../containers/Bills";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

import router from "../app/Router.js";

jest.mock("../app/Store", () => MockedStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // Définit localStorage avec une session utilisateur de type "Employee"
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      // Crée un élément racine dans le DOM
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      // Initialise le routage
      router();
      // Déclenche la navigation vers la page des factures
      window.onNavigate(ROUTES_PATH.Bills);
       // Attend que l'icône de la fenêtre soit présente dans le DOM
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      // Vérifie si l'icône a la classe "active-icon"
      const hasActiveIconClass = windowIcon.classList.contains("active-icon");
      expect(hasActiveIconClass).toBe(true);
    });
    
    // Vérifie que les factures sont ordonnées de la plus ancienne à la plus récente
    test("Then bills should be ordered from earliest to latest", () => {
      // Injecte le HTML simulé dans le DOM
      document.body.innerHTML = BillsUI({ data: bills });
      // Récupère les dates des factures
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      // Fonction de comparaison pour l'ordre antichronologique
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      // Trie les dates dans l'ordre antichronologique
      const datesSorted = [...dates].sort(antiChrono);
      // Vérifie si les dates sont bien triées dans l'ordre antichronologique
      expect(dates).toEqual(datesSorted);
    });

    // Vérifie que le clic sur le bouton "Nouvelle Facture" navigue vers la page "NewBill"
    test("Then it should render NewBill Page", () => {
       // Définit localStorage avec une session utilisateur de type "Employee"
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      // Crée un élément racine dans le DOM
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      // Initialise le routage
      router();
      // Déclenche la navigation vers la page "NewBill"
      window.onNavigate(ROUTES_PATH.NewBill);
      // Crée une nouvelle instance de Bills
      const newBills = new Bills({
        document,
        onNavigate,
        localStorage: window.localStorage,
        store: null
      })
      // Récupère le bouton "Nouvelle Facture"
      const newBillBtn = screen.getByTestId('btn-new-bill')
      // Crée une fonction de clic simulée
      const handleClickNewBill = jest.fn(newBills.handleClickNewBill)
      // Ajoute un écouteur d'événement de clic sur le bouton "Nouvelle Facture"
      newBillBtn.addEventListener('click',handleClickNewBill)
      // Déclenche un événement de clic sur le bouton "Nouvelle Facture"
      fireEvent.click(newBillBtn);
      // Vérifie si la fonction handleClickNewBill a été appelée
      expect(handleClickNewBill).toHaveBeenCalled();
      // Vérifie si le texte "Envoyer une note de frais" est présent à l'écran
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
    }) 

    // Vérifie si handleClickIconEye est appelée lorsque l'icône est cliquée
    test("handleClickIconEye is called when the icon is clicked", () => {
      // Crée une instance Bills avec des fonctions simulées
      const billsInstance = new Bills({
        document: document,
        onNavigate: jest.fn(),
        store: MockedStore,
      });
      const mockIcon = document.createElement("div");
      mockIcon.setAttribute("data-bill-url", "mockBillUrl");
  
      // Mock de la méthode handleClickIconEye
      billsInstance.handleClickIconEye = jest.fn();
  
      // Mock de la fonction modal directement sur le prototype de window.$
      window.$.fn.modal = jest.fn();
  
      // Attache la méthode handleClickIconEye à l'événement de clic sur l'icône
      mockIcon.addEventListener("click", () =>
        billsInstance.handleClickIconEye(mockIcon)
      );
  
      // Déclenche l'événement de clic sur l'icône simulée
      mockIcon.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  
      // Vérifie si handleClickIconEye a été appelée avec les paramètres attendus
      expect(billsInstance.handleClickIconEye).toHaveBeenCalledWith(mockIcon);
    });

    // Vérifie si handleClickIconEye affiche le modal
    test("handleClickIconEye shows modal", () => {
      // Crée une instance Bills avec des fonctions simulées
      const billsInstance = new Bills({
        document: document,
        onNavigate: jest.fn(),
        store: MockedStore,
      });
      const mockIcon = document.createElement("div");
      mockIcon.setAttribute("data-bill-url", "mockBillUrl");
  
      // Mock de la fonction modal directement sur le prototype de window.$
      window.$.fn.modal = jest.fn();
      // Déclenche handleClickIconEye
      billsInstance.handleClickIconEye(mockIcon);
  
      // Vérifie si la fonction modal a été appelée avec les paramètres attendus
      expect(window.$.fn.modal).toHaveBeenCalledWith("show");
    });
  });

  

  describe("Bills", () => {
    it('should add event listener to each "eye" icon if they exist', () => {
      // Mock document.querySelectorAll pour retourner plusieurs icônes "œil"
      const mockIcon1 = document.createElement("div");
      const mockIcon2 = document.createElement("div");
      mockIcon1.setAttribute("data-testid", "icon-eye");
      mockIcon2.setAttribute("data-testid", "icon-eye");
      document.body.appendChild(mockIcon1);
      document.body.appendChild(mockIcon2);
      // Mock de la méthode handleClickIconEye
      const handleClickIconEyeMock = jest.fn();
      // Créer une nouvelle instance de Bills
      const billsInstance = new Bills({
        document,
        onNavigate: jest.fn(),
        store: {},
        localStorage: {},
      });
      // Affecter la méthode handleClickIconEyeMock à handleClickIconEye de l'instance de Bills
      billsInstance.handleClickIconEye = handleClickIconEyeMock;
      // Vérifier que des écouteurs d'événements sont attachés à chaque icône "œil"
      expect(mockIcon1.onclick).toBeDefined();
      expect(mockIcon2.onclick).toBeDefined();
      // Déclencher l'événement de clic sur mockIcon1
      mockIcon1.click();
      // Vérifier que handleClickIconEye est appelé avec mockIcon1
      expect(handleClickIconEyeMock).toHaveBeenCalledWith(mockIcon1);
      // Déclencher l'événement de clic sur mockIcon2
      mockIcon2.click();
      // Vérifier que handleClickIconEye est appelé avec mockIcon2
      expect(handleClickIconEyeMock).toHaveBeenCalledWith(mockIcon2);
    });
  });

  describe("getBills", () => {
    let instance;
    // Avant chaque test, on crée une nouvelle instance de la classe Bills avec des fonctions simulées
    beforeEach(() => {
      instance = new Bills({
        document: {
          querySelector: jest.fn(),
          querySelectorAll: jest.fn(),
        },
        onNavigate: jest.fn(),
        store: {
          bills: jest.fn().mockReturnThis(), // Mock de la fonction bills du store
          list: jest.fn(),// Mock de la fonction list du store
        },
        localStorage: {},// localStorage vide
      });
    });

    // Teste le cas où les factures sont renvoyées lorsque le store est défini
    test("should return bills when store is defined", async () => {
      // Factures fictives
      const mockBills = [
        { date: "2022-01-01", status: "pending" },
        { date: "2022-02-01", status: "accepted" },
      ];
      // On simule la résolution de la promesse avec les factures fictives
      instance.store.list.mockResolvedValue(mockBills);
      // On appelle la méthode getBills de l'instance Bills
      const result = await instance.getBills();
      // On vérifie que le résultat retourné est conforme aux attentes
      expect(result).toEqual([
        { date: "1 Jan. 22", status: "En attente" },
        { date: "1 Fév. 22", status: "Accepté" },
      ]);
    });

    // Teste la gestion d'une erreur lorsque le format de date est incorrect
    test("should handle error when date format is incorrect", async () => {
      // Facture fictive avec un format de date incorrect
      const mockBills = [{ date: "incorrect-date", status: "pending" }];
      // On simule la résolution de la promesse avec la facture fictive
      instance.store.list.mockResolvedValue(mockBills);
      // On appelle la méthode getBills de l'instance Bills
      const result = await instance.getBills();
      // On vérifie que le résultat retourné est conforme aux attentes
      expect(result).toEqual([
        { date: "incorrect-date", status: "En attente" },
      ]);
    });

    // Teste le cas où le store n'est pas défini
    test("should return undefined when store is not defined", async () => {
      // On affecte undefined à la propriété store de l'instance
      instance.store = undefined;
      // On appelle la méthode getBills de l'instance Bills
      const result = await instance.getBills();
       // On vérifie que le résultat retourné est undefined
      expect(result).toBeUndefined();
    });
  });
  describe("When an error occurs on the API", () => {
    beforeEach(() => {
      // On espionne la méthode "bills" du MockedStore
      jest.spyOn(MockedStore, "bills")
      // On définit une localStorageMock sur l'objet window
      Object.defineProperty(
        window,
        'localStorage',
        { value: localStorageMock }
      )
      // On stocke un utilisateur dans localStorage pour simuler une session
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'a@a'
      }))
      // On crée un élément racine dans le DOM
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      // On appelle la fonction router pour initialiser le routage
      router()
    })

    // Teste la récupération des factures depuis l'API et échoue avec un message d'erreur 404
    test("fetches bills from an API and fails with 404 message error", async () => {
      // On simule un rejet de la promesse avec une erreur "Erreur 404"
      const error = MockedStore.bills().mock404Error() // apelle la promise d'une erreur
      await expect(error).rejects.toThrow('Erreur 404') // on s'attend à ce que l'erreur envoyée soit bien l'erreur 404
    })

    // Teste la récupération des messages depuis une API et échoue avec un message d'erreur 500
    test("fetches messages from an API and fails with 500 message error", async () => {
      // On simule un rejet de la promesse avec une erreur "Erreur 500"
      const error = MockedStore.bills().mock500Error() // apelle la promise d'une erreur
      await expect(error).rejects.toThrow('Erreur 500') // on s'attend à ce que l'erreur envoyée soit bien l'erreur 500
    })
  })
});
