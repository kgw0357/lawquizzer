// State Management
let state = {
    token: localStorage.getItem("token") || null,
    email: localStorage.getItem("email") || null,
    currentScreen: "auth",
    currentQuizzes: [],
    currentQuestionIndex: 0,
    score: 0,
    wrongCount: 0,
    currentSourceText: ""
};

// API Base URL (Relative if hosted on server, absolute localhost:8000 if opened as local file)
const API_BASE = window.location.protocol === "file:" ? "http://localhost:8000" : "";

// Legal Sample Texts for Easy Testing
const LEGAL_SAMPLES = {
    "하자담보책임": `매매의 목적물에 하자가 있는 때에는 제575조제1항의 규정을 준용한다. 그러나 매수인이 하자있는 것을 알았거나 과실로 인하여 이를 알지 못한 때에는 그러하지 아니하다.
전항의 계약해제나 손해배상의 청구는 매수인이 그 사실을 안 날로부터 6월내에 하여야 한다.
경매의 경우에는 물건의 하자로 인한 담보책임은 적용되지 않고, 권리의 하자에 대해서만 담보책임이 인정된다.
담보책임 규정은 임의규정으로 담보책임 면제 특약은 유효하지만, 매도인이 알고 고지하지 아니한 사실에 대하여는 책임을 면하지 못한다.`,
    
    "증여": `증여는 당사자 일방이 무상으로 재산을 상대방에 수여하는 의사를 표시하고 상대방이 이를 승낙함으로써 그 효력이 생긴다.
서면에 의하지 아니한 증여의 계약은 각 당사자가 이를 해제할 수 있다.
수증자가 증여자에 대하여 부양의무가 있는 경우 이를 이행하지 아니하는 때에는 증여자는 그 증여를 해제할 수 있다.
망은행위로 인한 해제 등은 이미 이행한 부분에 대하여는 영향을 미치지 아니한다.
증여자는 원칙적으로 담보책임을 지지 않는다.
상대방이 일정한 의무를 부담할 것을 조건으로 하는 부담있는 증여에는 쌍무계약에 관한 규정이 적용된다.`,
    
    "임대차": `임대차는 당사자 일방이 상대방에게 목적물을 사용, 수익하게 할 것을 약정하고 상대방이 이에 대하여 차임을 지급할 것을 약정함으로써 그 효력이 생긴다.
임차물의 일부가 임차인의 과실없이 멸실 기타 사유로 인하여 사용, 수익할 수 없는 때에는 임차인은 그 부분의 비율에 의한 차임의 감액을 청구할 수 있다.
임대차기간의 약정이 없는 때에는 당사자는 언제든지 계약해지의 통고를 할 수 있다. 임대인이 해지통고한 경우 6개월, 임차인이 해지통고한 경우 1개월이 경과하면 효력이 생긴다.
임차인은 임대인의 동의없이 그 권리를 양도하거나 임차물을 전대하지 못하며, 임차인이 이를 위반한 때에는 임대인은 계약을 해지할 수 있다.
임차인이 차임을 2기 연체하는 때에는 임대인은 계약을 해지할 수 있습니다. 임차인이 보존필요비를 지출한 때에는 임대인에게 즉시 청구할 수 있다.`
};

// Hardcoded civil law templates for mock generator
const MOCK_LAW_TEMPLATES = {
    "하자담보책임": [
        {
            "question": "매매의 목적물에 하자가 있는 경우, 매수인은 하자를 안 날로부터 6개월 내에 계약해제나 손해배상을 청구해야 한다.",
            "answer": "O",
            "explanation": "민법 제582조에 의하면 매매 목적물 하자에 따른 매수인의 권리(해제, 손해배상 등) 행사 기간은 매수인이 그 사실을 안 날로부터 6개월 이내입니다."
        },
        {
            "question": "목적물의 하자가 계약의 목적을 달성할 수 없을 정도로 중대한 경우에도 매수인은 계약을 해제할 수 없고 손해배상만 청구할 수 있다.",
            "answer": "X",
            "explanation": "민법 제580조 및 제575조 제1항에 의하면 목적물의 하자로 인하여 계약의 목적을 달성할 수 없는 때에는 매수인은 계약을 해제할 수 있으므로 잘못된 설명입니다."
        },
        {
            "question": "매수인이 계약 당시에 목적물에 하자가 있음을 알았거나 과실로 인하여 알지 못한 때에는 매도인은 담보책임을 지지 않는다.",
            "answer": "O",
            "explanation": "민법 제580조 제1항 단서에 의하면 매수인이 하자가 있음을 알았거나 과실로 인해 이를 알지 못한 때에는 매도인의 담보책임이 성립하지 않습니다."
        },
        {
            "question": "민법상 매도인의 담보책임 규정은 강행규정이므로 당사자 합의로 담보책임을 면하는 특약을 맺더라도 그 특약은 무효이다.",
            "answer": "X",
            "explanation": "매도인의 담보책임 규정은 임의규정으로 담보책임 면제 특약은 유효합니다. 다만, 매도인이 알고도 고지하지 아니한 사실에 대하여는 책임을 면할 수 없습니다(민법 제584조)."
        },
        {
            "question": "경매의 경우에는 물건의 하자에 대한 담보책임은 인정되지 않고, 권리의 하자에 대해서만 담보책임이 인정된다.",
            "answer": "O",
            "explanation": "민법 제580조 제2항에 의하면 공경매 of 물건의 하자로 인한 담보책임은 인정되지 않고, 권리의 하자에 대해서만 담보책임이 규정되어 있습니다."
        }
    ],
    "증여": [
        {
            "question": "서면에 의하지 아니한 증여의 계약은 각 당사자가 이를 해제할 수 있다.",
            "answer": "O",
            "explanation": "민법 제555조에 의하면 증여의 의사가 서면으로 표시되지 아니한 경우에는 각 당사자는 이를 해제할 수 있습니다."
        },
        {
            "question": "수증자가 증여자에 대하여 부양의무를 이행하지 않는 경우에도 증여자는 이미 성립한 증여계약을 해제할 수 없다.",
            "answer": "X",
            "explanation": "민법 제556조 제1항 제2호에 의하면 수증자가 증여자에 대하여 부양의무가 있음에도 이를 이행하지 아니하는 때에는 증여자는 증여를 해제할 수 있습니다."
        },
        {
            "question": "서면에 의하지 않은 증여의 해제는 이미 이행을 완료한 부분에 대해서도 소급하여 무효로 만든다.",
            "answer": "X",
            "explanation": "민법 제558조에 의하면 서면에 의하지 않은 증여의 해제나 망은행위로 인한 해제 등은 이미 이행한 부분에 대하여는 영향을 미치지 않습니다."
        },
        {
            "question": "증여자는 원칙적으로 증여의 목적인 물건 또는 권리의 하자나 흠결에 대하여 담보책임을 지지 않는다.",
            "answer": "O",
            "explanation": "민법 제559조 제1항에 따라 증여자는 무상 계약의 특성상 원칙적으로 증여 목적물의 하자에 대해 책임을 지지 않습니다. 다만, 하자를 알고도 고지하지 않은 경우는 예외입니다."
        },
        {
            "question": "상대방이 일정한 의무를 부담할 것을 조건으로 하는 부담있는 증여에는 쌍무계약에 관한 규정이 적용된다.",
            "answer": "O",
            "explanation": "민법 제561조에 따라 부담있는 증여에 대해서는 특별한 규정이 없는 한 쌍무계약(동시이행항변권, 위험부담 등)에 관한 규정이 적용됩니다."
        }
    ],
    "임대차": [
        {
            "question": "임차물의 일부가 임차인의 과실 없이 멸실된 경우, 임차인은 그 부분의 비율에 의한 차임 감액을 청구할 수 있다.",
            "answer": "O",
            "explanation": "민법 제627조 제1항에 따라 임차물의 일부가 임차인의 과실 없이 사용·수익할 수 없게 된 때에는 임차인은 차임의 감액을 청구할 수 있습니다."
        },
        {
            "question": "임대차 기간의 약정이 없는 경우, 임대인이 계약 해지를 통고하면 임차인이 통고를 받은 날로부터 1개월이 지나면 계약이 종료된다.",
            "answer": "X",
            "explanation": "민법 제635조 제2항 제1호에 따라 토지, 건물 기타 공작물 임대차에서 임대인이 해지통고를 한 경우 임차인이 받은 날로부터 '6개월'이 경과해야 효력이 발생합니다. (임차인이 통고한 경우는 1개월)"
        },
        {
            "question": "임차인은 임대인의 동의 없이 임차권을 양도하거나 임차물을 전대하지 못하며, 이를 위반 시 임대인은 계약을 해지할 수 있다.",
            "answer": "O",
            "explanation": "민법 제629조 제1항 및 제2항에 따라 무단 양도 및 전대는 금지되며, 무단 행위 시 임대인은 임대차 계약을 즉시 해지할 수 있습니다."
        },
        {
            "question": "임대차 계약에서 임차인이 차임을 1기만 연체하더라도 임대인은 즉시 임대차 계약을 해지할 수 있다.",
            "answer": "X",
            "explanation": "민법 제640조에 따라 건물 기타 공작물의 임대차의 경우 차임 연체액이 '2기'의 차임액에 달하는 때에만 임대인이 계약을 해지할 수 있습니다."
        },
        {
            "question": "임차인이 임차물의 보존에 관한 필요비를 지출한 때에는 임대차 종료 전이라도 즉시 임대인에게 그 상환을 청구할 수 있다.",
            "answer": "O",
            "explanation": "민법 제626조 제1항에 의하면 임차인이 임차물의 보존에 관한 필요비를 지출한 때에는 임대차 종료 여부와 상관없이 즉시 상환 청구가 가능합니다. (유익비의 경우는 임대차 종료 시 가액 증가가 현존한 때 청구)"
        }
    ]
};

// DOM Elements
const elements = {
    // Header
    headerLogo: document.getElementById("header-logo"),
    userNavArea: document.getElementById("user-nav-area"),
    navNotesBtn: document.getElementById("nav-notes-btn"),
    userEmailDisplay: document.getElementById("user-email-display"),
    logoutBtn: document.getElementById("logout-btn"),
    
    // Auth Screen
    authScreen: document.getElementById("auth-screen"),
    tabLogin: document.getElementById("tab-login"),
    tabSignup: document.getElementById("tab-signup"),
    loginForm: document.getElementById("login-form"),
    signupForm: document.getElementById("signup-form"),
    loginEmail: document.getElementById("login-email"),
    loginPassword: document.getElementById("login-password"),
    signupEmail: document.getElementById("signup-email"),
    signupPassword: document.getElementById("signup-password"),
    signupPasswordConfirm: document.getElementById("signup-password-confirm"),
    switchToSignup: document.getElementById("switch-to-signup"),
    switchToLogin: document.getElementById("switch-to-login"),
    
    // Screens
    dashboardScreen: document.getElementById("dashboard-screen"),
    quizScreen: document.getElementById("quiz-screen"),
    quizResultScreen: document.getElementById("quiz-result-screen"),
    notesScreen: document.getElementById("notes-screen"),
    
    // Dashboard
    studyText: document.getElementById("study-text"),
    charCount: document.getElementById("char-count"),
    quizGenerateForm: document.getElementById("quiz-generate-form"),
    apiSettingsTrigger: document.getElementById("api-settings-trigger"),
    apiSettingsContent: document.getElementById("api-settings-content"),
    userGeminiKey: document.getElementById("user-gemini-key"),
    statsWrongCount: document.getElementById("stats-wrong-count"),
    goNotesBtn: document.getElementById("go-notes-btn"),
    
    // Quiz Play
    quizQuitBtn: document.getElementById("quiz-quit-btn"),
    quizProgressFill: document.getElementById("quiz-progress-fill"),
    quizProgressText: document.getElementById("quiz-progress-text"),
    quizCardPanel: document.getElementById("quiz-card-panel"),
    feedbackIndicator: document.getElementById("feedback-indicator"),
    quizQuestionText: document.getElementById("quiz-question-text"),
    quizActionsBlock: document.getElementById("quiz-actions-block"),
    quizFeedbackAccordion: document.getElementById("quiz-feedback-accordion"),
    feedbackResultHeader: document.getElementById("feedback-result-header"),
    feedbackExplanationText: document.getElementById("feedback-explanation-text"),
    nextQuestionBtn: document.getElementById("next-question-btn"),
    
    // Quiz Result
    resultScore: document.getElementById("result-score"),
    resultScoreMessage: document.getElementById("result-score-message"),
    resultHomeBtn: document.getElementById("result-home-btn"),
    resultNotesBtn: document.getElementById("result-notes-btn"),
    
    // Wrong Notes
    notesBackBtn: document.getElementById("notes-back-btn"),
    notesListContainer: document.getElementById("notes-list-container"),
    
    // Overlay & Toast
    loadingOverlay: document.getElementById("loading-overlay"),
    loadingTextMsg: document.getElementById("loading-text-msg"),
    toastAlert: document.getElementById("toast-alert"),
    toastMessageText: document.getElementById("toast-message-text")
};

// --- Initialization ---
document.addEventListener("DOMContentLoaded", async () => {
    initEventListeners();
    
    // Load local storage API key if exists
    if (elements.userGeminiKey && localStorage.getItem("user_gemini_key")) {
        elements.userGeminiKey.value = localStorage.getItem("user_gemini_key");
    }
    
    // Validate existing session token
    if (state.token && state.email) {
        let isValid = false;
        
        // 1. If it's a server JWT token (doesn't start with local-token-), validate against server
        if (!state.token.startsWith("local-token-") && window.location.protocol !== 'file:') {
            try {
                const res = await fetch(`${API_BASE}/api/notes/incorrect`, {
                    headers: { "Authorization": `Bearer ${state.token}` }
                });
                if (res.ok) {
                    isValid = true;
                    // Sync notes in background
                    const serverNotes = await res.json();
                    localStorage.setItem(`incorrect_notes_${state.email}`, JSON.stringify(serverNotes));
                }
            } catch (err) {
                console.log("Server token validation failed, checking locally:", err);
            }
        }
        
        // 2. If it's a local token, or server token failed, validate locally
        if (!isValid) {
            const users = JSON.parse(localStorage.getItem("registered_users")) || [];
            const userExists = users.some(u => u.email === state.email);
            if (userExists && state.token === `local-token-${state.email}`) {
                isValid = true;
            }
        }
        
        if (isValid) {
            showScreen("dashboard");
            updateUserNav();
            fetchStats();
        } else {
            logout();
        }
    } else {
        logout();
    }
});

// --- Screen Router ---
function showScreen(screenId) {
    state.currentScreen = screenId;
    
    // Hide all
    if (elements.authScreen) elements.authScreen.style.display = "none";
    elements.dashboardScreen.style.display = "none";
    elements.quizScreen.style.display = "none";
    elements.quizResultScreen.style.display = "none";
    elements.notesScreen.style.display = "none";
    
    // Show/hide header nav based on auth
    const isAuth = screenId === "auth";
    elements.userNavArea.style.display = isAuth ? "none" : "flex";
    
    // Show selected
    if (screenId === "auth" && elements.authScreen) elements.authScreen.style.display = "flex";
    if (screenId === "dashboard") elements.dashboardScreen.style.display = "block";
    if (screenId === "quiz") elements.quizScreen.style.display = "block";
    if (screenId === "quiz-result") elements.quizResultScreen.style.display = "block";
    if (screenId === "notes") elements.notesScreen.style.display = "block";
}

// --- Update header user info ---
function updateUserNav() {
    if (elements.userEmailDisplay) {
        elements.userEmailDisplay.textContent = state.email || "";
    }
}

// --- Event Listeners ---
function initEventListeners() {
    // Header Logo Click -> Home (only if logged in)
    elements.headerLogo.addEventListener("click", () => {
        if (state.token) showScreen("dashboard");
    });

    // Logout
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener("click", () => {
            logout();
        });
    }

    // Auth Tabs
    if (elements.tabLogin) {
        elements.tabLogin.addEventListener("click", () => switchAuthTab("login"));
    }
    if (elements.tabSignup) {
        elements.tabSignup.addEventListener("click", () => switchAuthTab("signup"));
    }
    if (elements.switchToSignup) {
        elements.switchToSignup.addEventListener("click", (e) => { e.preventDefault(); switchAuthTab("signup"); });
    }
    if (elements.switchToLogin) {
        elements.switchToLogin.addEventListener("click", (e) => { e.preventDefault(); switchAuthTab("login"); });
    }

    // Auth Form Submissions
    if (elements.loginForm) {
        elements.loginForm.addEventListener("submit", handleLogin);
    }
    if (elements.signupForm) {
        elements.signupForm.addEventListener("submit", handleSignup);
    }

    // Dashboard Samples
    document.querySelectorAll(".sample-tag").forEach(tag => {
        tag.addEventListener("click", () => {
            const type = tag.dataset.type;
            if (LEGAL_SAMPLES[type]) {
                elements.studyText.value = LEGAL_SAMPLES[type];
                triggerCharCount();
            }
        });
    });

    // Textarea Character Count
    elements.studyText.addEventListener("input", triggerCharCount);

    // Gemini API settings accordion
    elements.apiSettingsTrigger.addEventListener("click", () => {
        const parent = elements.apiSettingsTrigger.parentElement;
        parent.classList.toggle("expanded");
    });
    
    // Save API key locally when user inputs it
    elements.userGeminiKey.addEventListener("input", () => {
        localStorage.setItem("user_gemini_key", elements.userGeminiKey.value.trim());
    });

    // Quiz Generation Submit
    elements.quizGenerateForm.addEventListener("submit", handleQuizGenerate);

    // Navigation Buttons
    elements.navNotesBtn.addEventListener("click", () => showScreen("notes"));
    elements.goNotesBtn.addEventListener("click", () => showScreen("notes"));
    elements.resultNotesBtn.addEventListener("click", () => showScreen("notes"));
    
    elements.notesBackBtn.addEventListener("click", () => {
        showScreen("dashboard");
        fetchStats();
    });
    elements.resultHomeBtn.addEventListener("click", () => {
        showScreen("dashboard");
        fetchStats();
    });

    // Quiz Solving Buttons
    elements.quizActionsBlock.querySelectorAll(".choice-btn").forEach(btn => {
        btn.addEventListener("click", () => handleAnswerSelect(btn.dataset.answer));
    });

    // Next Question Button
    elements.nextQuestionBtn.addEventListener("click", handleNextQuestion);

    // Quit Quiz
    elements.quizQuitBtn.addEventListener("click", () => {
        if (confirm("정말 학습을 중단하고 홈으로 돌아가시겠습니까?")) {
            showScreen("dashboard");
            fetchStats();
        }
    });

    // Setup notes view triggers
    elements.notesScreen.addEventListener("click", handleNotesClick);
}

// --- Auth Tab Switcher ---
function switchAuthTab(tab) {
    if (tab === "login") {
        elements.tabLogin.classList.add("active");
        elements.tabSignup.classList.remove("active");
        elements.loginForm.style.display = "block";
        elements.signupForm.style.display = "none";
    } else {
        elements.tabSignup.classList.add("active");
        elements.tabLogin.classList.remove("active");
        elements.signupForm.style.display = "block";
        elements.loginForm.style.display = "none";
    }
}

// --- Auth Handlers ---
async function handleLogin(e) {
    e.preventDefault();
    const email = elements.loginEmail.value.trim();
    const password = elements.loginPassword.value;

    showLoading(true, "로그인 중...");
    let loggedIn = false;
    let errorMsg = "이메일 또는 비밀번호가 일치하지 않습니다.";
    if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" && window.location.protocol !== "file:") {
        errorMsg = "이메일 또는 비밀번호가 일치하지 않습니다. (이 배포 서버에 처음 접속하셨다면 회원가입을 먼저 해주세요!)";
    }

    // 1. Try server login first (if server is available)
    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            state.token = data.token;
            state.email = data.email;
            localStorage.setItem("token", data.token);
            localStorage.setItem("email", data.email);
            
            // Sync to local registered users for offline fallback
            const localUsers = JSON.parse(localStorage.getItem("registered_users")) || [];
            if (!localUsers.some(u => u.email === email)) {
                localUsers.push({ email, password });
                localStorage.setItem("registered_users", JSON.stringify(localUsers));
            } else {
                const idx = localUsers.findIndex(u => u.email === email);
                localUsers[idx].password = password;
                localStorage.setItem("registered_users", JSON.stringify(localUsers));
            }

            // Sync incorrect notes from server to localStorage
            try {
                const notesRes = await fetch(`${API_BASE}/api/notes/incorrect`, {
                    headers: { "Authorization": `Bearer ${data.token}` }
                });
                if (notesRes.ok) {
                    const serverNotes = await notesRes.json();
                    localStorage.setItem(`incorrect_notes_${email}`, JSON.stringify(serverNotes));
                }
            } catch (notesErr) {
                console.error("Failed to sync incorrect notes from server", notesErr);
            }

            loggedIn = true;
        } else {
            errorMsg = data.detail || "이메일 또는 비밀번호가 일치하지 않습니다.";
        }
    } catch (serverErr) {
        console.log("Server login failed or unreachable, falling back to local login:", serverErr);
    }

    // 2. Local fallback login
    if (!loggedIn) {
        try {
            await new Promise(resolve => setTimeout(resolve, 300));
            const users = JSON.parse(localStorage.getItem("registered_users")) || [];
            const user = users.find(u => u.email === email);
            
            if (!user || user.password !== password) {
                throw new Error(errorMsg);
            }

            const mockToken = `local-token-${email}`;
            state.token = mockToken;
            state.email = email;
            localStorage.setItem("token", mockToken);
            localStorage.setItem("email", email);
            loggedIn = true;
        } catch (err) {
            showLoading(false);
            showToast(err.message);
            return;
        }
    }

    if (loggedIn) {
        showLoading(false);
        updateUserNav();
        showScreen("dashboard");
        fetchStats();
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const email = elements.signupEmail.value.trim();
    const password = elements.signupPassword.value;
    const confirm = elements.signupPasswordConfirm.value;

    if (password !== confirm) {
        showToast("비밀번호가 일치하지 않습니다.");
        return;
    }

    showLoading(true, "회원가입 처리 중...");
    let signedUpOnServer = false;
    let errorMsg = "회원가입에 실패했습니다.";

    // 1. Try server signup
    try {
        const res = await fetch(`${API_BASE}/api/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            signedUpOnServer = true;
        } else {
            errorMsg = data.detail || "회원가입에 실패했습니다.";
            if (res.status === 400 || errorMsg.includes("이미")) {
                showLoading(false);
                showToast(errorMsg);
                return;
            }
        }
    } catch (serverErr) {
        console.log("Server signup unreachable, registering locally:", serverErr);
    }

    // 2. Register locally (always sync locally)
    try {
        await new Promise(resolve => setTimeout(resolve, 400));
        const users = JSON.parse(localStorage.getItem("registered_users")) || [];
        if (users.some(u => u.email === email)) {
            throw new Error("이미 등록된 이메일 주소입니다.");
        }

        users.push({ email, password });
        localStorage.setItem("registered_users", JSON.stringify(users));

        showLoading(false);
        showToast("회원가입이 완료되었습니다! 로그인해 주세요.", true);
        
        elements.signupEmail.value = "";
        elements.signupPassword.value = "";
        elements.signupPasswordConfirm.value = "";
        switchAuthTab("login");
        elements.loginEmail.value = email;
    } catch (err) {
        showLoading(false);
        showToast(err.message);
    }
}

function logout() {
    state.token = null;
    state.email = null;
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    showScreen("auth");
}

// --- Helper UI Updates ---
function triggerCharCount() {
    const len = elements.studyText.value.length;
    elements.charCount.textContent = len;
}

// Show/Hide Loading Overlay
function showLoading(show, message = "") {
    if (show) {
        elements.loadingTextMsg.textContent = message;
        elements.loadingOverlay.style.display = "flex";
    } else {
        elements.loadingOverlay.style.display = "none";
    }
}

function showToast(message, isInfo = false, duration = null) {
    elements.toastMessageText.textContent = message;
    elements.toastAlert.className = isInfo ? "toast-alert info" : "toast-alert";
    elements.toastAlert.style.display = "block";
    
    // Errors display longer so users can read them; info messages are brief
    const ms = duration !== null ? duration : (isInfo ? 3000 : 7000);
    setTimeout(() => {
        elements.toastAlert.style.display = "none";
    }, ms);
}

// --- Local Storage Database Helper Functions ---
function getIncorrectNotes() {
    if (!state.email) return [];
    return JSON.parse(localStorage.getItem(`incorrect_notes_${state.email}`)) || [];
}

function saveIncorrectNotes(notes) {
    if (!state.email) return;
    localStorage.setItem(`incorrect_notes_${state.email}`, JSON.stringify(notes));
}

function addIncorrectNote(quiz, user_answer) {
    const notes = getIncorrectNotes();
    if (notes.some(n => n.question === quiz.question)) return;

    notes.unshift({
        note_id: Date.now() + Math.random(),
        quiz_id: quiz.id,
        question: quiz.question,
        correct_answer: quiz.answer,
        user_answer: user_answer,
        explanation: quiz.explanation,
        source_text: state.currentSourceText,
        created_at: new Date().toISOString()
    });
    saveIncorrectNotes(notes);
}

function deleteIncorrectNote(noteId) {
    let notes = getIncorrectNotes();
    notes = notes.filter(n => String(n.note_id) !== String(noteId));
    saveIncorrectNotes(notes);
}

function updateWrongStats() {
    const notes = getIncorrectNotes();
    state.wrongCount = notes.length;
    elements.statsWrongCount.textContent = state.wrongCount;
}

// --- Event Handlers ---

// Fetch User Wrong Note Stats
function fetchStats() {
    updateWrongStats();
}

// Quiz Generation API Trigger
async function handleQuizGenerate(e) {
    e.preventDefault();
    const text = elements.studyText.value.trim();
    if (text.length < 10) {
        showToast("텍스트가 너무 짧습니다. 10자 이상 입력해주세요.");
        return;
    }
    
    const api_key = elements.userGeminiKey.value.trim() || null;
    state.currentSourceText = text;
    
    showLoading(true, "AI가 텍스트 분석 및 O/X 퀴즈를 생성하고 있습니다...");
    try {
        if (api_key) {
            // Try client-side direct call to Gemini API
            // Do NOT silently fall back — show real error to user
            state.currentQuizzes = await generateQuizzesFromGemini(text, api_key);
        } else {
            // High quality mock generator running entirely in JS
            console.log("No Gemini API key, running local JS generator.");
            await new Promise(resolve => setTimeout(resolve, 1000));
            state.currentQuizzes = generateQuizzesMock(text);
        }
        
        state.currentQuestionIndex = 0;
        state.score = 0;
        
        showLoading(false);
        elements.studyText.value = "";
        triggerCharCount();
        startQuizSession();
    } catch (err) {
        showLoading(false);
        // Show the ACTUAL error message so user knows what went wrong
        showToast(err.message || "퀴즈 생성 중 오류가 발생했습니다.");
        console.error("Quiz generation error:", err);
    }
}

// Translate Gemini API English error messages to Korean
function translateGeminiError(msg) {
    if (!msg) return '알 수 없는 오류가 발생했습니다.';

    // API key errors
    if (/API.?key.?not.?valid|API.?KEY.?INVALID/i.test(msg))
        return 'API 키가 유효하지 않습니다. 키를 다시 확인해 주세요.';
    if (/API.?key.?expired/i.test(msg))
        return 'API 키가 만료되었습니다. 새 키를 발급받아 주세요.';
    if (/API.?key.?not.?found|missing.?API.?key/i.test(msg))
        return 'API 키가 입력되지 않았습니다.';
    if (/PERMISSION_DENIED|permission.?denied|403/i.test(msg))
        return 'API 키에 이 서비스에 대한 접근 권한이 없습니다. Google AI Studio에서 권한을 확인해 주세요.';
    if (/UNAUTHENTICATED|401/i.test(msg))
        return 'API 키 인증에 실패했습니다. 키가 올바른지 확인해 주세요.';

    // Quota / rate limit errors
    if (/quota.?exceeded|Quota.?exceeded|RESOURCE_EXHAUSTED/i.test(msg))
        return '이 API 키의 사용 할당량이 초과되었습니다. 잠시 후 다시 시도하거나 유료 플랜으로 업그레이드해 주세요.';
    if (/rate.?limit|Too.?Many.?Requests|429/i.test(msg))
        return '요청이 너무 많습니다(Rate Limit 초과). 잠시 후 다시 시도해 주세요.';
    if (/free.?tier/i.test(msg))
        return '무료 플랜의 요청 한도를 초과했습니다. Google AI Studio에서 유료 플랜으로 전환해 주세요.';

    // Model errors
    if (/model.?not.?found|MODEL_NOT_FOUND/i.test(msg))
        return '지정된 Gemini 모델을 찾을 수 없습니다.';
    if (/not.?support|unsupported/i.test(msg))
        return '이 API 키로는 해당 모델을 사용할 수 없습니다.';

    // Network / server errors
    if (/UNAVAILABLE|Service.?Unavailable|503/i.test(msg))
        return 'Gemini 서버가 일시적으로 사용 불가 상태입니다. 잠시 후 다시 시도해 주세요.';
    if (/INTERNAL|500/i.test(msg))
        return 'Gemini 서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
    if (/network|fetch|Failed to fetch|NetworkError/i.test(msg))
        return '네트워크 연결에 실패했습니다. 인터넷 연결 상태를 확인해 주세요.';
    if (/timeout|DEADLINE_EXCEEDED/i.test(msg))
        return '요청 시간이 초과되었습니다. 텍스트를 줄이거나 잠시 후 다시 시도해 주세요.';

    // Safety / content filter
    if (/SAFETY|safety.?filter|blocked|BLOCKED/i.test(msg))
        return '입력한 텍스트가 안전 정책에 의해 차단되었습니다. 다른 텍스트를 입력해 주세요.';

    // Invalid request
    if (/INVALID_ARGUMENT|invalid.?request|400/i.test(msg))
        return '잘못된 요청입니다. 텍스트 내용을 확인해 주세요.';

    // Default: return original message (in case it's already Korean or unrecognized)
    return msg;
}

// Check if the error is an auth/key error (stop retrying other models)
function isAuthError(msg) {
    return /API.?key|API_KEY|PERMISSION_DENIED|UNAUTHENTICATED|401|403/i.test(msg);
}

// Call Gemini API Directly from Browser
async function generateQuizzesFromGemini(text, apiKey) {
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    const prompt = `당신은 대한민국 민법 전문 AI 학습 튜터입니다.
다음 입력된 법학 텍스트(조문 또는 판례)를 꼼꼼히 분석하여, 법적으로 참(O) 또는 거짓(X)을 명확하게 판별할 수 있는 핵심 질문 문장 5개를 생성하십시오.
각 질문에 대해 정답(O 또는 X)과 상세한 법적 해설(관련 조문 번호나 판례 요지 포함)을 제공해야 합니다.

출력은 반드시 다음 스키마의 JSON 배열 형태여야 하며, 다른 부연 설명이나 마크다운 코드 블록 기호 없이 순수한 JSON 텍스트로만 응답해야 합니다. answer 값은 반드시 대문자 'O' 또는 'X'여야 합니다:
[
  {
    "question": "O/X 판별을 위한 법적 진술 문장",
    "answer": "O 또는 X",
    "explanation": "해당 문장이 참 또는 거짓인 이유와 관련된 구체적인 조문 번호 또는 판례 근거를 포함한 해설"
  }
]

분석할 법학 텍스트:
\"\"\"
${cleanedText}
\"\"\"`;

    // Try models in order of preference
    const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
    let lastError = null;
    
    for (const model of modelsToTry) {
        try {
            console.log(`Trying Gemini model: ${model}`);
            const result = await callGeminiAPI(prompt, model, apiKey);
            console.log(`Success with model: ${model}`);
            return result;
        } catch (err) {
            console.warn(`Model ${model} failed:`, err.message);
            lastError = err;
            // If it's an auth/key error, stop immediately — other models will fail too
            if (isAuthError(err.message)) {
                throw new Error(translateGeminiError(err.message));
            }
        }
    }
    
    throw lastError || new Error('모든 Gemini 모델 호출에 실패했습니다.');
}

// Helper function to call specific Gemini API model
async function callGeminiAPI(prompt, model, apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    // Do NOT use responseMimeType: application/json — it's not supported on all models
    // and can cause unexpected behavior. Use plain text and parse manually.
    const payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 2048
        }
    };
    
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        const rawMsg = errorJson?.error?.message || `HTTP ${response.status} 오류`;
        throw new Error(translateGeminiError(rawMsg));
    }
    
    const resJson = await response.json();
    
    // Validate response structure
    if (!resJson.candidates || resJson.candidates.length === 0) {
        throw new Error("Gemini 응답에 candidates가 없습니다.");
    }
    
    const candidate = resJson.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error("Gemini 응답 구조가 올바르지 않습니다.");
    }
    
    const textOut = candidate.content.parts[0].text;
    if (!textOut) {
        throw new Error("Gemini 응답이 비어 있습니다.");
    }
    
    // Robustly extract JSON array from the text
    // Sometimes the model wraps it in ```json ... ``` or adds extra text
    let jsonStr = textOut;
    const jsonMatch = textOut.match(/\[\s*\{[\s\S]*?\}\s*\]/);
    if (jsonMatch) {
        jsonStr = jsonMatch[0];
    } else {
        // Try stripping markdown code block
        jsonStr = textOut.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    }
    
    let quizList;
    try {
        quizList = JSON.parse(jsonStr);
    } catch (parseErr) {
        console.error("JSON parse failed. Raw text:", textOut);
        throw new Error("Gemini 응답을 JSON으로 파싱하지 못했습니다.");
    }
    
    if (!Array.isArray(quizList)) {
        throw new Error("Gemini 응답이 배열 형식이 아닙니다.");
    }
    
    const validatedQuizzes = [];
    for (let item of quizList) {
        if (item.question && item.answer && item.explanation) {
            let ans = String(item.answer).toUpperCase().trim();
            if (ans === 'TRUE' || ans === '참' || ans === 'O') ans = 'O';
            if (ans === 'FALSE' || ans === '거짓' || ans === 'X') ans = 'X';
            
            if (ans === 'O' || ans === 'X') {
                validatedQuizzes.push({
                    id: Date.now() + Math.random(),
                    question: item.question,
                    answer: ans,
                    explanation: item.explanation
                });
            }
        }
    }
    
    if (validatedQuizzes.length > 0) {
        return validatedQuizzes.slice(0, 5);
    } else {
        throw new Error("유효한 퀴즈를 추출하지 못했습니다. 응답 형식이 다릅니다.");
    }
}

// Mock Quiz Generator in JS
function generateQuizzesMock(text) {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    
    for (let keyword of Object.keys(MOCK_LAW_TEMPLATES)) {
        if (cleaned.includes(keyword)) {
            return MOCK_LAW_TEMPLATES[keyword].map((item, idx) => ({
                id: Date.now() + idx,
                ...item
            }));
        }
    }
    
    let sentences = cleaned.split(/[.!?]\s+/);
    sentences = sentences.map(s => s.trim()).filter(s => s.length > 15 && s.length < 100);
    
    if (sentences.length < 3) {
        sentences = [
            "법률행위의 일부분이 무효인 때에는 그 전부를 무효로 함이 원칙이다.",
            "의사표시자가 그 통지를 발송한 후 사망하거나 제한능력자가 되어도 의사표시의 효력에 영향을 미치지 아니한다.",
            "행위능력 없는 미성년자가 법정대리인의 동의 없이 한 법률행위는 취소할 수 있다.",
            "선량한 풍속 기타 사회질서에 위반한 사항을 내용으로 하는 법률행위는 무효로 한다.",
            "당사자의 궁박, 경솔 또는 무경험으로 인하여 현저하게 공정을 잃은 법률행위는 취소할 수 있다."
        ];
    }
    
    sentences.sort(() => 0.5 - Math.random());
    const selected = sentences.slice(0, 5);
    
    const replacements = [
        ["있다", "없다"], ["임한다", "임하지 아니한다"], ["않는다", "한다"],
        ["인정된다", "인정되지 아니한다"], ["무효로 한다", "유효로 한다"],
        ["취소할 수 있다", "취소할 수 없다"], ["효력이 있다", "효력이 없다"],
        ["유효하다", "무효이다"], ["원칙으로 한다", "원칙이 아니다"]
    ];
    
    return selected.map((sent, i) => {
        const isTrue = (i % 2 === 0);
        if (isTrue) {
            return {
                id: Date.now() + i,
                question: sent,
                answer: "O",
                explanation: `제시된 문장인 '${sent}'은(는) 법리적 조문 및 판례의 내용과 부합하여 참(O)입니다.`
            };
        } else {
            let negated = sent;
            let modified = false;
            for (let [oldStr, newStr] of replacements) {
                if (negated.includes(oldStr)) {
                    negated = negated.replace(oldStr, newStr);
                    modified = true;
                    break;
                }
            }
            if (!modified) {
                negated += "고 볼 수는 없다.";
            }
            return {
                id: Date.now() + i,
                question: negated,
                answer: "X",
                explanation: `원래 법리상 '${sent}'이(가) 타당하므로, '${negated}'은(는) 법률 관계 설명으로 적절하지 않아 거짓(X)입니다.`
            };
        }
    });
}

// Start Quiz Play Session
function startQuizSession() {
    showScreen("quiz");
    renderQuestion();
}

function renderQuestion() {
    const quiz = state.currentQuizzes[state.currentQuestionIndex];
    elements.quizProgressText.textContent = `문제 ${state.currentQuestionIndex + 1} / 5`;
    elements.quizProgressFill.style.width = `${((state.currentQuestionIndex + 1) / 5) * 100}%`;
    
    elements.quizQuestionText.textContent = quiz.question;
    elements.quizFeedbackAccordion.style.display = "none";
    
    elements.quizActionsBlock.querySelectorAll(".choice-btn").forEach(btn => {
        btn.disabled = false;
        btn.classList.remove("selected");
    });
    
    elements.feedbackIndicator.className = "feedback-indicator";
}

// Handle Answer Selection & Check
function handleAnswerSelect(selectedAnswer) {
    elements.quizActionsBlock.querySelectorAll(".choice-btn").forEach(btn => {
        btn.disabled = true;
        if (btn.dataset.answer === selectedAnswer) {
            btn.classList.add("selected");
        }
    });
    
    const quiz = state.currentQuizzes[state.currentQuestionIndex];
    const correct = (quiz.answer === selectedAnswer);
    
    elements.feedbackIndicator.classList.add("show");
    if (correct) {
        elements.feedbackIndicator.classList.add("correct");
        state.score++;
    } else {
        elements.feedbackIndicator.classList.add("incorrect");
        addIncorrectNote(quiz, selectedAnswer);
    }
    
    setTimeout(() => {
        elements.feedbackIndicator.classList.remove("show");
        renderFeedbackAccordion(correct, quiz.answer, selectedAnswer, quiz.explanation);
    }, 1200);
}

function renderFeedbackAccordion(correct, correctAns, userAns, explanation) {
    const badge = elements.quizFeedbackAccordion.querySelector(".status-badge");
    const correctDisplay = elements.quizFeedbackAccordion.querySelector(".correct-answer-display");
    
    if (correct) {
        badge.className = "status-badge correct-badge";
        badge.textContent = "정답입니다!";
    } else {
        badge.className = "status-badge incorrect-badge";
        badge.textContent = "틀렸습니다!";
    }
    
    correctDisplay.textContent = `나의 답변: ${userAns}  |  실제 정답: ${correctAns}`;
    elements.feedbackExplanationText.textContent = explanation;
    
    elements.quizFeedbackAccordion.style.display = "block";
}

// Handle Transition to next Question
function handleNextQuestion() {
    state.currentQuestionIndex++;
    if (state.currentQuestionIndex < 5 && state.currentQuestionIndex < state.currentQuizzes.length) {
        renderQuestion();
    } else {
        showScreen("quiz-result");
        elements.resultScore.textContent = state.score;
        
        let msg = "";
        if (state.score === 5) msg = "만점입니다! 완벽한 민법 지식을 보유하고 계시네요.";
        else if (state.score >= 3) msg = "합격점입니다! 틀린 부분만 다시 한번 짚어보세요.";
        else msg = "기본 개념 학습이 필요합니다. 오답노트를 보고 약점을 집중 공략하세요.";
        
        elements.resultScoreMessage.textContent = msg;
    }
}

// Wrong Notes View & Actions
function showNotes() {
    showLoading(true, "오답 노트 불러오는 중...");
    try {
        const notes = getIncorrectNotes();
        showLoading(false);
        
        elements.notesListContainer.innerHTML = "";
        
        if (notes.length === 0) {
            elements.notesListContainer.innerHTML = `
                <div class="notes-empty-state">
                    <span class="empty-icon">🎉</span>
                    <h4>등록된 오답이 없습니다.</h4>
                    <p>퀴즈를 푸는 동안 틀린 내용이 있으면 자동으로 이곳에 수집됩니다.</p>
                </div>
            `;
            return;
        }
        
        notes.forEach(note => {
            const dateStr = note.created_at ? note.created_at.substring(0, 10) : "이전 기록";
            const card = document.createElement("div");
            card.className = "note-card glass-panel";
            card.innerHTML = `
                <div class="note-meta">
                    <span class="note-date">등록일: ${dateStr}</span>
                    <button class="delete-note-btn" data-id="${note.note_id}">이해함 (삭제)</button>
                </div>
                <div class="note-question-box">
                    <span class="question-mark">Q.</span>
                    <p class="note-question-text">${escapeHtml(note.question)}</p>
                </div>
                <div class="note-answers">
                    <span class="ans-label incorrect-ans">나의 오답: ${note.user_answer}</span>
                    <span class="ans-label correct-ans">실제 정답: ${note.correct_answer}</span>
                </div>
                <div class="note-explanation-box">
                    <h5>해설 및 근거</h5>
                    <p>${escapeHtml(note.explanation)}</p>
                </div>
                <div class="settings-accordion" style="margin-bottom: 0;">
                    <button type="button" class="accordion-trigger" data-toggle="source">
                        <span>📄 원본 학습 텍스트 보기</span>
                        <span class="chevron">▼</span>
                    </button>
                    <div class="accordion-content">
                        <p style="font-size: 0.85rem; color: #9ca3af; margin-top: 8px; white-space: pre-wrap; word-break: break-all;">
                            ${escapeHtml(note.source_text)}
                        </p>
                    </div>
                </div>
            `;
            elements.notesListContainer.appendChild(card);
        });
    } catch (err) {
        showLoading(false);
        const isQuotaError = err.message.includes("quota") || err.message.includes("Quota") || err.message.includes("limit") || err.message.includes("Rate limit");
        if (isQuotaError) {
            alert(`[Gemini API 사용량 한도 초과]
구글 Gemini API 호출 한도가 초과되었습니다.

오류 상세 내용:
${err.message}

해결 방법:
설정(⚙️)에서 입력한 API 키를 지우고 비워두시면, 실시간 AI 대신 내장된 '고품질 오프라인 Mock 학습 모드'로 문제없이 계속 학습하실 수 있습니다.`);
        } else {
            showToast(err.message);
        }
    }
}

// Delegate note list click events (delete note & expand source text accordion)
async function handleNotesClick(e) {
    const target = e.target;
    
    // Delete Button click
    if (target.classList.contains("delete-note-btn")) {
        const noteId = target.dataset.id;
        showLoading(true, "오답 노트 수정 중...");
        try {
            await new Promise(resolve => setTimeout(resolve, 300));
            deleteIncorrectNote(noteId);
            showLoading(false);
            showToast("오답 노트에서 제거되었습니다.", true);
            showNotes();
        } catch (err) {
            showLoading(false);
            showToast(err.message);
        }
    }
    
    // Toggle 원본 텍스트 accordion
    const trigger = target.closest("[data-toggle='source']");
    if (trigger) {
        const accordion = trigger.parentElement;
        accordion.classList.toggle("expanded");
        const content = accordion.querySelector(".accordion-content");
        if (accordion.classList.contains("expanded")) {
            content.style.maxHeight = content.scrollHeight + "px";
        } else {
            content.style.maxHeight = "0";
        }
    }
}

// Override showScreen to load notes dynamically
const originalShowScreen = showScreen;
showScreen = function(screenId) {
    originalShowScreen(screenId);
    if (screenId === "notes") {
        showNotes();
    }
};

// Safe HTML Escape
function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
