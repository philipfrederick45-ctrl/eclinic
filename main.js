// PWA and Service Worker Registration
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("sw.js")
        .then((registration) => {
          console.log("SW registered: ", registration)
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError)
        })
    })
  }
  
  // Authentication Manager
  class AuthManager {
    constructor() {
      this.currentUser = this.getCurrentUser()
      this.init()
    }
  
    init() {
      // Check if user is logged in
      if (this.currentUser) {
        this.showMainApp()
      } else {
        this.showAuthScreen()
      }
  
      // Bind auth form events
      const loginForm = document.getElementById("loginFormElement")
      const registerForm = document.getElementById("registerFormElement")
  
      if (loginForm) {
        loginForm.addEventListener("submit", (e) => this.handleLogin(e))
      }
  
      if (registerForm) {
        registerForm.addEventListener("submit", (e) => this.handleRegister(e))
      }
    }
  
    getCurrentUser() {
      const user = localStorage.getItem("eclinic_user")
      return user ? JSON.parse(user) : null
    }
  
    saveUser(user) {
      localStorage.setItem("eclinic_user", JSON.stringify(user))
      this.currentUser = user
    }
  
    handleLogin(e) {
      e.preventDefault()
      const formData = new FormData(e.target)
      const email = formData.get("email")
      const password = formData.get("password")
  
      // Get stored users
      const users = this.getStoredUsers()
      const user = users.find((u) => u.email === email && u.password === password)
  
      if (user) {
        this.saveUser(user)
        this.showMainApp()
        this.showSuccessMessage("Login successful!")
      } else {
        alert("Invalid email or password. Please try again.")
      }
    }
  
    handleRegister(e) {
      e.preventDefault()
      const formData = new FormData(e.target)
      const name = formData.get("name")
      const email = formData.get("email")
      const phone = formData.get("phone")
      const password = formData.get("password")
      const confirmPassword = formData.get("confirmPassword")
  
      // Validation
      if (password !== confirmPassword) {
        alert("Passwords do not match!")
        return
      }
  
      // Check if user already exists
      const users = this.getStoredUsers()
      if (users.find((u) => u.email === email)) {
        alert("User with this email already exists!")
        return
      }
  
      // Create new user
      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        phone,
        password,
        createdAt: new Date().toISOString(),
      }
  
      users.push(newUser)
      localStorage.setItem("eclinic_users", JSON.stringify(users))
  
      this.saveUser(newUser)
      this.showMainApp()
      this.showSuccessMessage("Registration successful!")
    }
  
    getStoredUsers() {
      const users = localStorage.getItem("eclinic_users")
      return users ? JSON.parse(users) : []
    }
  
    showAuthScreen() {
      document.getElementById("authScreen").style.display = "flex"
      document.getElementById("mainApp").style.display = "none"
    }
  
    showMainApp() {
      document.getElementById("authScreen").style.display = "none"
      document.getElementById("mainApp").style.display = "block"
  
      // Update welcome message
      const welcomeElement = document.getElementById("userWelcome")
      if (welcomeElement && this.currentUser) {
        welcomeElement.textContent = `Welcome, ${this.currentUser.name}!`
      }
    }
  
    logout() {
      localStorage.removeItem("eclinic_user")
      this.currentUser = null
      this.showAuthScreen()
      this.showSuccessMessage("Logged out successfully!")
    }
  
    showSuccessMessage(message) {
      const successMessage = document.getElementById("successMessage")
      if (successMessage) {
        successMessage.querySelector("p").textContent = message
        successMessage.style.display = "block"
        setTimeout(() => {
          successMessage.style.display = "none"
        }, 3000)
      }
    }
  }
  
  // Navigation functions
  function showLogin() {
    document.getElementById("loginForm").style.display = "block"
    document.getElementById("registerForm").style.display = "none"
  }
  
  function showRegister() {
    document.getElementById("loginForm").style.display = "none"
    document.getElementById("registerForm").style.display = "block"
  }
  
  function showBookingSection() {
    document.getElementById("bookingSection").style.display = "block"
    document.getElementById("appointmentsSection").style.display = "none"
  
    // Update nav buttons
    document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"))
    event.target.classList.add("active")
  }
  
  function showAppointmentsSection() {
    document.getElementById("bookingSection").style.display = "none"
    document.getElementById("appointmentsSection").style.display = "block"
  
    // Update nav buttons
    document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"))
    event.target.classList.add("active")
  
    // Refresh appointments display
    appointmentManager.displayAppointments()
  }
  
  function logout() {
    authManager.logout()
  }
  
  // Check online/offline status
  function updateOnlineStatus() {
    const offlineMessage = document.getElementById("offlineMessage")
    if (offlineMessage) {
      offlineMessage.style.display = navigator.onLine ? "none" : "block"
    }
  }
  
  window.addEventListener("online", updateOnlineStatus)
  window.addEventListener("offline", updateOnlineStatus)
  window.addEventListener("load", updateOnlineStatus)
  
  // Enhanced Appointment Manager with CRUD operations
  class AppointmentManager {
    constructor() {
      this.appointments = this.loadAppointments()
      this.init()
    }
  
    init() {
      // Set minimum date to today
      const dateInput = document.getElementById("appointmentDate")
      if (dateInput) {
        const today = new Date().toISOString().split("T")[0]
        dateInput.min = today
      }
  
      // Bind form submission
      const form = document.getElementById("appointmentForm")
      if (form) {
        form.addEventListener("submit", (e) => this.handleFormSubmit(e))
      }
  
      // Bind edit form submission
      const editForm = document.getElementById("editAppointmentForm")
      if (editForm) {
        editForm.addEventListener("submit", (e) => this.handleEditSubmit(e))
      }
  
      // Request notification permission
      this.requestNotificationPermission()
    }
  
    loadAppointments() {
      const stored = localStorage.getItem("eclinic_appointments")
      return stored ? JSON.parse(stored) : []
    }
  
    saveAppointments() {
      localStorage.setItem("eclinic_appointments", JSON.stringify(this.appointments))
    }
  
    generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2)
    }
  
    handleFormSubmit(e) {
      e.preventDefault()
  
      const formData = new FormData(e.target)
      const appointment = {
        id: this.generateId(),
        userId: authManager.currentUser.id,
        fullName: authManager.currentUser.name,
        contact: authManager.currentUser.email,
        doctor: formData.get("doctor"),
        date: formData.get("appointmentDate"),
        time: formData.get("appointmentTime"),
        reason: formData.get("reason") || "General consultation",
        repeat: formData.get("repeat"),
        createdAt: new Date().toISOString(),
      }
  
      // Validate required fields
      if (!appointment.doctor || !appointment.date || !appointment.time) {
        alert("Please fill in all required fields.")
        return
      }
  
      // Check if appointment is in the future
      const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`)
      if (appointmentDateTime <= new Date()) {
        alert("Please select a future date and time for your appointment.")
        return
      }
  
      this.appointments.push(appointment)
      this.saveAppointments()
      this.scheduleNotification(appointment)
  
      // Handle recurring appointments
      if (appointment.repeat !== "none") {
        this.createRecurringAppointments(appointment)
      }
  
      authManager.showSuccessMessage("Appointment booked successfully!")
      e.target.reset()
    }
  
    createRecurringAppointments(originalAppointment) {
      const recurringCount = 4
  
      for (let i = 1; i <= recurringCount; i++) {
        const appointmentDate = new Date(`${originalAppointment.date}T${originalAppointment.time}`)
  
        if (originalAppointment.repeat === "weekly") {
          appointmentDate.setDate(appointmentDate.getDate() + 7 * i)
        } else if (originalAppointment.repeat === "monthly") {
          appointmentDate.setMonth(appointmentDate.getMonth() + i)
        }
  
        const recurringAppointment = {
          ...originalAppointment,
          id: this.generateId(),
          date: appointmentDate.toISOString().split("T")[0],
          createdAt: new Date().toISOString(),
        }
  
        this.appointments.push(recurringAppointment)
        this.scheduleNotification(recurringAppointment)
      }
  
      this.saveAppointments()
    }
  
    displayAppointments() {
      const appointmentsList = document.getElementById("appointmentsList")
      const noAppointments = document.getElementById("noAppointments")
  
      if (!appointmentsList) return
  
      // Filter appointments for current user
      const userAppointments = this.appointments.filter((apt) => apt.userId === authManager.currentUser.id)
  
      if (userAppointments.length === 0) {
        appointmentsList.style.display = "none"
        noAppointments.style.display = "block"
        return
      }
  
      // Sort appointments by date and time
      const sortedAppointments = userAppointments.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`)
        const dateB = new Date(`${b.date}T${b.time}`)
        return dateA - dateB
      })
  
      appointmentsList.innerHTML = sortedAppointments
        .map((appointment) => {
          const appointmentDate = new Date(`${appointment.date}T${appointment.time}`)
          const isUpcoming = appointmentDate > new Date()
  
          return `
                  <div class="appointment-item ${!isUpcoming ? "past-appointment" : ""}">
                      <div class="appointment-header">
                          <div class="appointment-doctor">${appointment.doctor}</div>
                          <div class="appointment-actions">
                              <button class="btn-edit" onclick="appointmentManager.editAppointment('${appointment.id}')">
                                  Edit
                              </button>
                              <button class="btn-danger" onclick="appointmentManager.deleteAppointment('${appointment.id}')">
                                  Delete
                              </button>
                          </div>
                      </div>
                      <div class="appointment-details">
                          <div class="appointment-detail">
                              <strong>Date:</strong> ${this.formatDate(appointment.date)}
                          </div>
                          <div class="appointment-detail">
                              <strong>Time:</strong> ${this.formatTime(appointment.time)}
                          </div>
                          <div class="appointment-detail">
                              <strong>Reason:</strong> ${appointment.reason}
                          </div>
                          ${
                            appointment.repeat !== "none"
                              ? `
                          <div class="appointment-detail">
                              <strong>Repeat:</strong> ${appointment.repeat}
                          </div>
                          `
                              : ""
                          }
                      </div>
                  </div>
              `
        })
        .join("")
  
      appointmentsList.style.display = "block"
      noAppointments.style.display = "none"
    }
  
    editAppointment(id) {
      const appointment = this.appointments.find((apt) => apt.id === id)
      if (!appointment) return
  
      // Populate edit form
      document.getElementById("editAppointmentId").value = appointment.id
      document.getElementById("editDoctor").value = appointment.doctor
      document.getElementById("editDate").value = appointment.date
      document.getElementById("editTime").value = appointment.time
      document.getElementById("editReason").value = appointment.reason
  
      // Set minimum date to today
      const today = new Date().toISOString().split("T")[0]
      document.getElementById("editDate").min = today
  
      // Show modal
      document.getElementById("editModal").style.display = "flex"
    }
  
    handleEditSubmit(e) {
      e.preventDefault()
  
      const formData = new FormData(e.target)
      const appointmentId = formData.get("editAppointmentId") || document.getElementById("editAppointmentId").value
      const appointmentIndex = this.appointments.findIndex((apt) => apt.id === appointmentId)
  
      if (appointmentIndex === -1) return
  
      // Update appointment
      this.appointments[appointmentIndex] = {
        ...this.appointments[appointmentIndex],
        doctor: formData.get("doctor"),
        date: formData.get("date"),
        time: formData.get("time"),
        reason: formData.get("reason") || "General consultation",
        updatedAt: new Date().toISOString(),
      }
  
      this.saveAppointments()
      this.closeEditModal()
      this.displayAppointments()
      authManager.showSuccessMessage("Appointment updated successfully!")
    }
  
    closeEditModal() {
      document.getElementById("editModal").style.display = "none"
    }
  
    deleteAppointment(id) {
      if (confirm("Are you sure you want to delete this appointment?")) {
        this.appointments = this.appointments.filter((apt) => apt.id !== id)
        this.saveAppointments()
        this.displayAppointments()
        authManager.showSuccessMessage("Appointment deleted successfully!")
      }
    }
  
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }
  
    formatTime(timeString) {
      const [hours, minutes] = timeString.split(":")
      const date = new Date()
      date.setHours(Number.parseInt(hours), Number.parseInt(minutes))
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    }
  
    async requestNotificationPermission() {
      if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission()
      }
    }
  
    scheduleNotification(appointment) {
      if ("Notification" in window && Notification.permission === "granted") {
        const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`)
        const reminderTime = new Date(appointmentDateTime.getTime() - 30 * 60 * 1000)
        const now = new Date()
  
        if (reminderTime > now) {
          const timeUntilReminder = reminderTime.getTime() - now.getTime()
  
          setTimeout(() => {
            new Notification("eClinic - Appointment Reminder", {
              body: `Your appointment with ${appointment.doctor} is in 30 minutes at ${this.formatTime(appointment.time)}`,
              icon: "icon-192x192.png",
              badge: "icon-192x192.png",
              tag: appointment.id,
              requireInteraction: true,
            })
          }, timeUntilReminder)
        }
      }
    }
  }
  
  // Global functions for modal
  function closeEditModal() {
    appointmentManager.closeEditModal()
  }
  
  // Initialize managers
  const authManager = new AuthManager()
  const appointmentManager = new AppointmentManager()
  
  // PWA install prompt
  let deferredPrompt
  
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault()
    deferredPrompt = e
  
    // Show install button or banner
    const installBanner = document.createElement("div")
    installBanner.innerHTML = `
          <div style="position: fixed; bottom: 20px; left: 20px; right: 20px; background: #1E90FF; color: white; padding: 1rem; border-radius: 8px; text-align: center; z-index: 1000;">
              <p style="margin-bottom: 0.5rem;">Install eClinic for quick access!</p>
              <button onclick="installPWA()" style="background: white; color: #1E90FF; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Install</button>
              <button onclick="this.parentElement.parentElement.remove()" style="background: transparent; color: white; border: 1px solid white; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; margin-left: 0.5rem;">Later</button>
          </div>
      `
    document.body.appendChild(installBanner)
  })
  
  function installPWA() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt")
        }
        deferredPrompt = null
      })
    }
  }
  