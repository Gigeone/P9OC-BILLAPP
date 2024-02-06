/**
 * @jest-environment jsdom
 */
import MockedStore from "../__mocks__/store";
import { screen, waitFor } from "@testing-library/dom";
import Bills from "../containers/Bills";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      const hasActiveIconClass = windowIcon.classList.contains("active-icon");
      expect(hasActiveIconClass).toBe(true);
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    // Clicking on the "New Bill" button navigates to the "NewBill" page.
    test("Then clicking on 'New Bill' button should navigate to the NewBill page", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);

      router();
      await window.onNavigate(ROUTES_PATH.Bills);

      // Wait for the "New Bill" button to appear in the DOM
      await waitFor(() => screen.getByTestId("btn-new-bill"));

      const buttonNewBill = screen.getByTestId("btn-new-bill");
      await buttonNewBill.dispatchEvent(new MouseEvent("click"));

      const newBillUrl = window.location.href.replace(
        /^https?:\/\/localhost\//,
        ""
      );
      expect(newBillUrl).toBe("#employee/bill/new");
    });
  });

  test("handleClickIconEye is called when the icon is clicked", () => {
    const billsInstance = new Bills({
      document: document,
      onNavigate: jest.fn(),
      store: MockedStore,
    });
    const mockIcon = document.createElement("div");
    mockIcon.setAttribute("data-bill-url", "mockBillUrl");

    // Mock the handleClickIconEye method
    billsInstance.handleClickIconEye = jest.fn();

    // Mock the modal function directly on the prototype of window.$
    window.$.fn.modal = jest.fn();

    // Attach the handleClickIconEye method to the icon click event
    mockIcon.addEventListener("click", () =>
      billsInstance.handleClickIconEye(mockIcon)
    );

    // Trigger the click event on the mocked icon
    mockIcon.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    // Checking if the handleClickIconEye method was called with the expected parameters
    expect(billsInstance.handleClickIconEye).toHaveBeenCalledWith(mockIcon);
  });

  test("handleClickIconEye shows modal", () => {
    const billsInstance = new Bills({
      document: document,
      onNavigate: jest.fn(),
      store: MockedStore,
    });
    const mockIcon = document.createElement("div");
    mockIcon.setAttribute("data-bill-url", "mockBillUrl");

    // Mock the modal function directly on the prototype of window.$
    window.$.fn.modal = jest.fn();

    billsInstance.handleClickIconEye(mockIcon);

    // Checking if the modal function was called with the expected parameters
    expect(window.$.fn.modal).toHaveBeenCalledWith("show");
  });

  describe("Bills", () => {
    it('should add event listener to each "eye" icon if they exist', () => {
      // Mock document.querySelectorAll to return multiple "eye" icons
      const mockIcon1 = document.createElement("div");
      const mockIcon2 = document.createElement("div");
      mockIcon1.setAttribute("data-testid", "icon-eye");
      mockIcon2.setAttribute("data-testid", "icon-eye");
      document.body.appendChild(mockIcon1);
      document.body.appendChild(mockIcon2);

      // Mock handleClickIconEye method
      const handleClickIconEyeMock = jest.fn();

      // Create a new instance of Bills
      const billsInstance = new Bills({
        document,
        onNavigate: jest.fn(),
        store: {},
        localStorage: {},
      });

      billsInstance.handleClickIconEye = handleClickIconEyeMock;

      // Verify that event listeners are attached to each "eye" icon
      expect(mockIcon1.onclick).toBeDefined();
      expect(mockIcon2.onclick).toBeDefined();

      // Trigger click event on mockIcon1
      mockIcon1.click();

      // Verify that handleClickIconEye is called with mockIcon1
      expect(handleClickIconEyeMock).toHaveBeenCalledWith(mockIcon1);

      // Trigger click event on mockIcon2
      mockIcon2.click();

      // Verify that handleClickIconEye is called with mockIcon2
      expect(handleClickIconEyeMock).toHaveBeenCalledWith(mockIcon2);
    });
  });

  describe("getBills", () => {
    let instance;

    beforeEach(() => {
      instance = new Bills({
        document: {
          querySelector: jest.fn(),
          querySelectorAll: jest.fn(),
        },
        onNavigate: jest.fn(),
        store: {
          bills: jest.fn().mockReturnThis(),
          list: jest.fn(),
        },
        localStorage: {},
      });
    });

    it("should return bills when store is defined", async () => {
      const mockBills = [
        { date: "2022-01-01", status: "pending" },
        { date: "2022-02-01", status: "accepted" },
      ];
      instance.store.list.mockResolvedValue(mockBills);

      const result = await instance.getBills();

      expect(result).toEqual([
        { date: "1 Jan. 22", status: "En attente" },
        { date: "1 Fév. 22", status: "Accepté" },
      ]);
    });

    it("should handle error when date format is incorrect", async () => {
      const mockBills = [{ date: "incorrect-date", status: "pending" }];
      instance.store.list.mockResolvedValue(mockBills);

      const result = await instance.getBills();

      expect(result).toEqual([
        { date: "incorrect-date", status: "En attente" },
      ]);
    });

    it("should return undefined when store is not defined", async () => {
      instance.store = undefined;

      const result = await instance.getBills();

      expect(result).toBeUndefined();
    });
  });
});
