import React from 'react';

export const IconHome = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-6 h-6" {...props}>
        <g fill="none">
            <path fill="url(#home-gradient-1)" d="M6 9h4v5H6z"></path>
            <path fill="url(#home-gradient-2)" d="M8.687 2.273a1 1 0 0 0-1.374 0l-4.844 4.58A1.5 1.5 0 0 0 2 7.943v4.569a1.5 1.5 0 0 0 1.5 1.5h3v-4a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v4h3a1.5 1.5 0 0 0 1.5-1.5v-4.57a1.5 1.5 0 0 0-.47-1.09z"></path>
            <path fill="url(#home-gradient-3)" fillRule="evenodd" d="m8.004 2.636l5.731 5.41a.75.75 0 1 0 1.03-1.091L8.86 1.382a1.25 1.25 0 0 0-1.724.007L1.23 7.059a.75.75 0 0 0 1.038 1.082z" clipRule="evenodd"></path>
            <defs>
                <linearGradient id="home-gradient-1" x1={8} x2={4.796} y1={9} y2={14.698} gradientUnits="userSpaceOnUse"><stop stopColor="#944600"></stop><stop offset={1} stopColor="#cd8e02"></stop></linearGradient>
                <linearGradient id="home-gradient-2" x1={3.145} x2={14.93} y1={1.413} y2={10.981} gradientUnits="userSpaceOnUse"><stop stopColor="#ffd394"></stop><stop offset={1} stopColor="#ffb357"></stop></linearGradient>
                <linearGradient id="home-gradient-3" x1={10.262} x2={6.945} y1={-0.696} y2={7.895} gradientUnits="userSpaceOnUse"><stop stopColor="#ff921f"></stop><stop offset={1} stopColor="#eb4824"></stop></linearGradient>
            </defs>
        </g>
    </svg>
);

export const IconQuiz = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6" {...props}>
        <g fill="none" stroke="#10b981" strokeWidth={1.5}>
            <path d="M7.5 3.5c-1.556.047-2.483.22-3.125.862c-.879.88-.879 2.295-.879 5.126v6.506c0 2.832 0 4.247.879 5.127C5.253 22 6.668 22 9.496 22h5c2.829 0 4.243 0 5.121-.88c.88-.879.88-2.294.88-5.126V9.488c0-2.83 0-4.246-.88-5.126c-.641-.642-1.569-.815-3.125-.862"></path>
            <path strokeLinejoin="round" d="M7.496 3.75c0-.966.784-1.75 1.75-1.75h5.5a1.75 1.75 0 1 1 0 3.5h-5.5a1.75 1.75 0 0 1-1.75-1.75Z"></path>
            <path strokeLinecap="round" d="M6.5 10h4"></path>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 11s.5 0 1 1c0 0 1.588-2.5 3-3"></path>
            <path strokeLinecap="round" d="M6.5 16h4"></path>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 17s.5 0 1 1c0 0 1.588-2.5 3-3"></path>
        </g>
    </svg>
);

export const IconChat = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" className="w-6 h-6" {...props}>
        <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}>
            <path stroke="#344054" d="M37.188 17.104a13.06 13.06 0 0 1 6.562 11.021a12.13 12.13 0 0 1-2.396 7.292l2.396 8.333l-8.333-3.604a17.7 17.7 0 0 1-7.292 1.52a15.56 15.56 0 0 1-14.812-9.27"></path>
            <path stroke="#306cfe" d="M37.5 19.792c0 7.479-7 13.541-15.625 13.541a17.7 17.7 0 0 1-7.292-1.52l-1.354.583l-6.979 3.02l2.396-8.333a12.13 12.13 0 0 1-2.396-7.291c0-7.48 7-13.542 15.625-13.542c7.563 0 13.875 4.667 15.313 10.854c.21.88.314 1.783.312 2.688"></path>
        </g>
    </svg>
);

export const IconDashboard = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6" {...props}>
        <g fill="none" strokeWidth={3}>
            <path fill="#8fecfa" d="M4.977 36.377C3.659 33.769 3 30.105 3 27C3 15.402 12.402 6 24 6s21 9.402 21 21c0 3.105-.659 6.77-1.976 9.377C42.475 37.46 41.293 38 40.076 38H7.923c-1.216 0-2.398-.539-2.946-1.623"></path>
            <path fill="#fff" d="M20.136 34.965a4 4 0 1 0 7.728 2.07a4 4 0 1 0-7.728-2.07"></path>
            <path stroke="#5928c5" strokeLinecap="round" strokeLinejoin="round" d="M9.854 32A15 15 0 0 1 9 27c0-8.284 6.716-15 15-15s15 6.716 15 15c0 1.753-.3 3.436-.853 5"></path>
            <path stroke="#5928c5" strokeLinecap="round" strokeLinejoin="round" d="M34 38h6.078c1.215 0 2.397-.539 2.945-1.623C44.342 33.769 45 30.105 45 27c0-11.598-9.402-21-21-21S3 15.402 3 27c0 3.105.659 6.77 1.977 9.377C5.525 37.46 6.707 38 7.923 38H14"></path>
            <path stroke="#5928c5" strokeLinecap="round" strokeLinejoin="round" d="M20.136 34.965a4 4 0 1 0 7.728 2.07a4 4 0 1 0-7.728-2.07m4.899-2.829l3.623-13.523"></path>
        </g>
    </svg>
);

export const IconCollapse = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="9" y1="3" x2="9" y2="21"></line>
    </svg>
);

export const IconExpand = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="15" y1="3" x2="15" y2="21"></line>
    </svg>
);


export const IconPlus = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);
export const IconChevron = ({ expanded }) => (
    <svg className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
);
export const IconFolder = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
);
export const IconFile = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
);

export const UserIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
export const AdjustmentsIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 16v-2m8-8h2M4 12H2m15.364 6.364l1.414 1.414M4.222 4.222l1.414 1.414m12.728 0l-1.414 1.414M6.343 17.657l-1.414 1.414M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
export const ClockIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
export const FolderIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
export const UploadIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
export const WrenchIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
export const UsersIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
export const CreditCardIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
export const MoonIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
export const LanguageIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m4 13h4m-4-4h4m-4-4h4M3 21h18M11 3.983c0 .878-.448 1.503-1.002 1.503-1.118 0-1.002-.625-1.002-1.503 0-.878.448-1.503 1.002-1.503 1.118 0 1.002.625 1.002 1.503zM5 21v-2.106a4.002 4.002 0 012.981-3.894 4.002 4.002 0 014.038 0A4.002 4.002 0 0115 18.894V21M5 12h14" /></svg>;
export const GlobeIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h8a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.707 4.293l.5-.5A2 2 0 0110.121 3h3.758a2 2 0 011.414.586l.5.5M7 11h10" /></svg>;
export const LogoutIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
export const ChevronRightIcon = () => <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;

export function StreamlinePlumpColorGlobalLearning({ className = '', style, ...props }) {
    // This icon is designed to "fit" its container by using 100% width/height and inheriting color if needed.
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
            viewBox="0 0 48 48"
            className={className}
            style={style}
            {...props}
        >
            <g fill="none" strokeWidth={3}>
                <path
                    fill="#8fecfa"
                    d="M41.805 24.804Q41.999 23.429 42 22c0-11.046-8.954-20-20-20S2 10.954 2 22c0 8.006 4.704 14.914 11.5 18.109V32.67l-.003-.169c0-2.424 1.445-4.56 3.658-5.558c1.199-.54 2.76-1.215 4.75-2.024c3.192-1.296 5.52-2.139 6.985-2.64c2.02-.69 4.2-.69 6.22 0c1.419.486 3.651 1.293 6.695 2.524"
                />
                <path
                    stroke="#5928c5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.428 28.5h10.321M3.428 15.333H40.57"
                />
                <path
                    fill="#fff"
                    d="M19.006 33.957c-1.344-.606-1.344-2.305 0-2.911a133 133 0 0 1 4.594-1.957c3.115-1.265 5.363-2.078 6.746-2.55a5.1 5.1 0 0 1 3.309 0c1.382.472 3.63 1.285 6.745 2.55a135 135 0 0 1 4.595 1.957c1.344.606 1.344 2.305 0 2.911a133 133 0 0 1-4.595 1.957c-3.114 1.265-5.363 2.078-6.745 2.55a5.1 5.1 0 0 1-3.31 0c-1.381-.472-3.63-1.285-6.745-2.55a133 133 0 0 1-4.595-1.957"
                />
                <path
                    fill="#fff"
                    d="M23.5 35.874v3.087c0 1.588.065 2.71.143 3.484c.102 1.022.68 1.893 1.617 2.313c1.268.57 3.462 1.244 6.74 1.244s5.472-.675 6.74-1.244c.936-.42 1.515-1.291 1.617-2.313c.078-.774.143-1.896.143-3.484v-3.087l-.1.04c-3.114 1.266-5.363 2.08-6.745 2.551a5.1 5.1 0 0 1-3.31 0c-1.382-.472-3.63-1.285-6.745-2.55z"
                />
                <path
                    stroke="#5928c5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 32.502v12.063M30.57 22c0-11.046-3.837-20-8.57-20c-4.735 0-8.572 8.954-8.572 20c0 2.275.163 4.462.463 6.5"
                />
                <path
                    stroke="#5928c5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M41.777 25q.222-1.47.223-3c0-11.046-8.954-20-20-20S2 10.954 2 22c0 7.809 4.475 14.572 11 17.865"
                />
                <path
                    stroke="#5928c5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.006 33.958c-1.344-.606-1.344-2.305 0-2.911A133 133 0 0 1 23.6 29.09c3.115-1.265 5.363-2.078 6.746-2.55a5.1 5.1 0 0 1 3.309 0c1.382.472 3.63 1.285 6.745 2.55a135 135 0 0 1 4.595 1.957c1.344.606 1.344 2.305 0 2.911a133 133 0 0 1-4.595 1.957c-3.114 1.265-5.363 2.078-6.745 2.55a5.1 5.1 0 0 1-3.31 0c-1.381-.472-3.63-1.285-6.745-2.55a133 133 0 0 1-4.595-1.957"
                />
                <path
                    stroke="#5928c5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M23.5 35.874v3.087c0 1.588.065 2.71.143 3.484c.102 1.022.68 1.893 1.617 2.313c1.268.57 3.462 1.244 6.74 1.244s5.472-.675 6.74-1.244c.936-.42 1.515-1.291 1.617-2.313c.078-.774.143-1.896.143-3.484v-3.087"
                />
            </g>
        </svg>
    );
}




// Grid and List Icons
export const IconGrid = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 8.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 018.25 20.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6A2.25 2.25 0 0115.75 3.75h2.25A2.25 2.25 0 0120.25 6v2.25a2.25 2.25 0 01-2.25 2.25H15.75A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75A2.25 2.25 0 0115.75 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H15.75a2.25 2.25 0 01-2.25-2.25v-2.25z" />
    </svg>
);
// Grid and List Icons
export const IconList = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);


// Quiz Status Icons
export function IconNotStarted(props) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={28}
            height={28}
            viewBox="0 0 24 24"
            fill="none"
            {...props}
        >
            <circle cx="12" cy="12" r="10" fill="#4a93fd" opacity="0.15" />
            <circle cx="12" cy="12" r="9" stroke="#4a93fd" strokeWidth="2" fill="none" />
            <path
                d="M10 9v6l5-3z"
                fill="#4a93fd"
                stroke="#4a93fd"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
// Quiz Status Icons
export function IconSuccessFilled(props) {
    // A checkmark in a circle, styled to fit with the other status icons
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={28}
            height={28}
            viewBox="0 0 24 24"
            fill="none"
            {...props}
        >
            <circle cx="12" cy="12" r="10" fill="#4a93fd" opacity="0.15" />
            <circle cx="12" cy="12" r="9" stroke="#4a93fd" strokeWidth="2" fill="none" />
            <path
                d="M8.5 12.5l2.5 2.5 4.5-4.5"
                stroke="#4a93fd"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    );
}
// Quiz Status Icons
export function IconCodexLoader(props) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={28} height={28} viewBox="0 0 24 24" {...props}>
            <circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke="#4a93fd"
                strokeLinecap="round"
                strokeWidth="2"
                strokeDasharray="37.7 12.57"
            >
                <animateTransform
                    attributeName="transform"
                    attributeType="XML"
                    dur="560ms"
                    from="0 12 12"
                    repeatCount="indefinite"
                    to="360 12 12"
                    type="rotate"
                />
            </circle>
        </svg>
    );
}
// Quiz Status Icons
export function IconErrorRounded(props) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={28}
            height={28}
            viewBox="0 0 24 24"
            fill="none"
            {...props}
        >
            <circle cx="12" cy="12" r="10" fill="#d9532c" opacity="0.15" />
            <circle cx="12" cy="12" r="9" stroke="#d9532c" strokeWidth="2" fill="none" />
            <path
                d="M12 8v4m0 4h.01"
                stroke="#d9532c"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    );
}


// Restart to generate quiz icon
export function IconRestart(props) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={28} height={28} viewBox="0 0 24 24" {...props}>
            <path fill="#4a93fd" fillRule="evenodd" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10m3.935-16.408a.75.75 0 0 1 .467.694v2.715a.75.75 0 0 1-.75.75H13a.75.75 0 0 1-.537-1.274l.762-.78a4.17 4.17 0 0 0-4.224 1.089c-1.668 1.707-1.668 4.483 0 6.19a4.17 4.17 0 0 0 5.998 0a4.4 4.4 0 0 0 1.208-2.472c.058-.418.39-.77.812-.77c.406 0 .742.325.703.729a5.9 5.9 0 0 1-1.65 3.562a5.67 5.67 0 0 1-8.144 0c-2.237-2.29-2.237-5.997 0-8.287a5.67 5.67 0 0 1 6.437-1.208l.75-.768a.75.75 0 0 1 .82-.17" clipRule="evenodd"></path>
        </svg>
    );
}