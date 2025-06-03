/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { getCompanyList } from "../../api/dashboard";
import Logo from "../../assets/auth/logo.png";
import smallLogo from "../../assets/auth/smallLogo.png";
import ArrowChevron from "../../assets/layout/arrow-right.png";
import contactBookLight from "../../assets/layout/contact-light.png";
import contactBookDark from "../../assets/layout/contact.png";
import dashboardLight from "../../assets/layout/dashboard-hover.png";
import dashboardDark from "../../assets/layout/dashboard.png";
import logout from "../../assets/layout/logout.png";
import historylight from "../../assets/layout/historylight.png";
import historydark from "../../assets/layout/history.png";
import chatLight from "../../assets/layout/chat-white.svg";
import chatDark from "../../assets/layout/chat.svg";
import contactDark from "../../assets/layout/phone.png";
import contactLight from "../../assets/layout/phonelight.png";
import userDark from "../../assets/layout/user.png";
import userLight from "../../assets/layout/userlight.png";
import voiceDark from "../../assets/layout/voicemail.png";
import voiceLight from "../../assets/layout/voicemaillight.png";
import useDebounce from "../../hooks/useDebounce";
import {
  clearAuth,
  setDialPad,
  setSelectedOrganization,
} from "../../store/slices/authSlice";
import { resetSessions } from "../../store/slices/callFeatureSlice";
import NotificationPermissionHandler from "../common/NotificationPermissionHandler";

function Index() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [companyList, setCompanyList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [searchCompany, setSearchCompany] = useState("");
  const debouncedSearch = useDebounce(searchCompany, 300);
  const showDialpad = useSelector((state) => state.auth.dialPad);
  const userRole = useSelector((state) => state.auth.user?.data?.userType);
  const userName = useSelector((state) => state.auth.user?.data);
  const dialPadModal = useSelector((state) => state.auth.dialPadModal);
  const userCompanyName = useSelector((state) => state.auth.user?.data?.company?.companyName);
  const isRegistered = useSelector((state) => state.sip.isRegistered);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const dialpadRef = useRef(null);
  const dropdownRef = useRef(null);

  let filteredMenuPath = [];
  if (userRole === "superadmin") {
    filteredMenuPath = [
      {
        menu: "Dashboard",
        link: "/",
        icondark: dashboardDark,
        iconlight: dashboardLight,
      },
      // {
      //   menu: "Organizations",
      //   link: "/organizations",
      //   icondark: organizationDark,
      //   iconlight: organizationLight,
      // },
      {
        menu: "Calls",
        link: "/calls",
        icondark: contactDark,
        iconlight: contactLight,
      },
      {
        menu: "Voicemail",
        link: "/voicemail",
        icondark: voiceDark,
        iconlight: voiceLight,
      },
      {
        menu: "Chat",
        link: "/chat",
        icondark: chatDark,
        iconlight: chatLight,
      },
      {
        menu: "History",
        link: "/history",
        icondark: historydark,
        iconlight: historylight,
      },
      {
        menu: "Contacts",
        link: "/contacts",
        icondark: contactBookDark,
        iconlight: contactBookLight,
      },
      {
        menu: "Users",
        link: "/users",
        icondark: userDark,
        iconlight: userLight,
      },
    ];
  } else if (userRole === "admin") {
    filteredMenuPath = [
      {
        menu: "Dashboard",
        link: "/",
        icondark: dashboardDark,
        iconlight: dashboardLight,
      },
      {
        menu: "Calls",
        link: "/calls",
        icondark: contactDark,
        iconlight: contactLight,
      },
      {
        menu: "Voicemail",
        link: "/voicemail",
        icondark: voiceDark,
        iconlight: voiceLight,
      },
      {
        menu: "Chat",
        link: "/chat",
        icondark: chatDark,
        iconlight: chatLight,
      },
      {
        menu: "History",
        link: "/history",
        icondark: historydark,
        iconlight: historylight,
      },
      {
        menu: "Contacts",
        link: "/contacts",
        icondark: contactBookDark,
        iconlight: contactBookLight,
      },
      {
        menu: "Users",
        link: "/users",
        icondark: userDark,
        iconlight: userLight,
      },
    ];
  } else if (userRole === "user") {
    filteredMenuPath = [
      {
        menu: "Dashboard",
        link: "/",
        icondark: dashboardDark,
        iconlight: dashboardLight,
      },
      {
        menu: "Calls",
        link: "/calls",
        icondark: contactDark,
        iconlight: contactLight,
      },
      {
        menu: "Voicemail",
        link: "/voicemail",
        icondark: voiceDark,
        iconlight: voiceLight,
      },
      {
        menu: "Chat",
        link: "/chat",
        icondark: chatDark,
        iconlight: chatLight,
      },
      {
        menu: "Contacts",
        link: "/contacts",
        icondark: contactBookDark,
        iconlight: contactBookLight,
      },
    ];
  }

  // Find the active menu item based on current path
  const activeMenu =
    filteredMenuPath.find((item) => item.link === location.pathname)?.menu ||
    "";

  const handleRotate = () => {
    setIsCollapsed((prev) => !prev);
  };

  const handleLogout = () => {
    dispatch(clearAuth());
    dispatch(resetSessions());
    navigate("/login");
  };

  useEffect(() => {
    if (!showDialpad || dialPadModal) return;
    function handleClickOutside(event) {
      if (dialpadRef.current && !dialpadRef.current.contains(event.target)) {
        dispatch(setDialPad(false));
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDialpad, dialPadModal, dispatch]);

  // Close dialpad on page reload
  useEffect(() => {
    if (!showDialpad || dialPadModal) return;
    dispatch(setDialPad(false));
  }, []);

  // company list
  const fetchCompanyList = async () => {
    setIsLoading(true);
    try {
      const response = await getCompanyList();
      setCompanyList(response?.data?.success);
      return response;
    } catch (error) {
      console.error("Error fetching company list:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyList();
  }, []);

  useEffect(() => {
    if (companyList && companyList.length > 0 && !selectedCompany) {
      setSelectedCompany(companyList[0]);
    }
    dispatch(setSelectedOrganization(selectedCompany));
  }, [companyList, selectedCompany]);

  useEffect(() => {
    if (!showCompanyDropdown) return;
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCompanyDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCompanyDropdown]);
  const filteredCompanyList = companyList.filter((company) =>
    company.companyName?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <main className="relative flex w-full h-screen bg-[#f2f8ff]">
      <aside
        className={`fixed top-0 left-0 h-screen shadow-2xs z-50 border-r-[1px] border-gray-100 bg-white p-4 transition-all duration-300 ease-linear ${
          isCollapsed ? "w-20" : "w-56"
        }`}
      >
        <div className="relative w-full h-full block">
          <Link
            to="/"
            className={`relative block pb-3.5 mb-5 border-b-[1px] border-b-gray-400`}
          >
            <img
              src={smallLogo}
              alt="Login"
              className={`mix-blend-multiply h-auto w-[30px] absolute top-0 left-2 transition-opacity duration-300 delay-200 ${
                isCollapsed ? "opacity-100" : "opacity-0"
              }`}
            />
            <img
              src={Logo}
              alt="Login"
              className={`mix-blend-multiply max-w-28 h-auto transition-opacity duration-300 ${
                isCollapsed ? "opacity-0" : "opacity-100 delay-200"
              }`}
            />
          </Link>
          <button
            onClick={handleRotate}
            className={`absolute top-7 right-[-26px] w-7 h-7 flex items-center justify-center rounded-full shadow bg-white cursor-pointer transition-transform duration-300 ease-linear ${
              isCollapsed ? "rotate-180" : "rotate-0"
            }`}
          >
            <img src={ArrowChevron} alt="Toggle" className="w-6 h-auto" />
          </button>
          <menu>
            {filteredMenuPath.map(({ menu, link, icondark, iconlight }) => {
              const path = link;
              const anchorText = menu;
              return (
                <div
                  key={menu}
                  className="relative"
                  onMouseEnter={() => setHoveredMenu(menu)}
                  onMouseLeave={() => setHoveredMenu(null)}
                >
                  <NavLink
                    to={path}
                    className={`flex items-center gap-1.5 h-12 rounded-[30px] mb-2.5 p-[12px]`}
                    style={({ isActive }) => {
                      return {
                        backgroundColor: isActive ? "#67308F" : "",
                        boxShadow: isActive
                          ? "0px 4px 20px rgba(103, 48, 143, 0.1)"
                          : "",
                      };
                    }}
                  >
                    {({ isActive }) => (
                      <>
                        <span className="inline-flex min-w-[24px] min-h-[24px] items-center justify-center">
                          <img
                            src={isActive ? iconlight : icondark}
                            alt={menu}
                            className="object-contain max-w-6 h-auto"
                          />
                        </span>
                        <span
                          className={`text-sm font-medium transition-opacity duration-300 ${
                            isCollapsed ? "opacity-0" : "opacity-100"
                          } ${isActive ? "!text-white" : ""}`}
                        >
                          {anchorText}
                        </span>
                      </>
                    )}
                  </NavLink>
                  {isCollapsed && hoveredMenu === menu && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 bg-[#67308F] text-[#fff] text-xs rounded px-3 py-1 shadow-lg whitespace-nowrap pointer-events-none">
                      {anchorText}
                    </div>
                  )}
                </div>
              );
            })}
          </menu>
          <Link
            to="#"
            className="absolute flex w-auto items-center bottom-3 left-0 gap-1.5 text-sm"
            onClick={handleLogout}
          >
            <img src={logout} alt="" className="" />
            <span
              className={`text-sm font-medium transition-opacity duration-300 ${
                isCollapsed ? "opacity-0" : "opacity-100"
              }`}
              style={{ color: "red" }}
            >
              LogOut
            </span>
          </Link>
        </div>
      </aside>
      <div
        className={`block transition-all duration-300 ease-linear ${
          isCollapsed ? "w-[calc(100%-79px)]" : "w-[calc(100%-223px)]"
        } ml-auto`}
      >
        <header
          className="sticky top-0 z-30 p-4 flex items-center justify-between w-full h-[60px] bg-white border-b-[1px] border-gray-200"
          style={{ boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)" }}
        >
          <div className="flex items-center gap-4">
            <h1>{activeMenu}</h1>
            {/* Company Dropdown */}
            {userRole !== "superadmin" && <h5>{userCompanyName}</h5>}
            {userRole === "superadmin" && (
              <div className="relative" ref={dropdownRef}>
                <button
                  className="ml-2 px-3 py-1 bg-gray-100 cursor-pointer rounded text-sm border border-gray-200 focus:outline-none min-w-[160px] text-left"
                  onClick={() => setShowCompanyDropdown((prev) => !prev)}
                >
                  {selectedCompany
                    ? selectedCompany.companyName
                    : "Select Company"}
                </button>
                {!isLoading && showCompanyDropdown && selectedCompany && (
                  <div className="absolute left-0 mt-1 w-64 max-h-80 bg-white border border-gray-200 rounded shadow-lg z-50 overflow-y-auto">
                    {/* Search Field */}
                    <div className="p-2 border-b border-gray-200 bg-gray-50">
                      <input
                        type="search"
                        value={searchCompany}
                        onChange={(e) => setSearchCompany(e.target.value)}
                        placeholder="Search company..."
                        className="w-full px-2 py-1 rounded border border-gray-200 text-sm focus:outline-none"
                      />
                    </div>
                    <ul>
                      {filteredCompanyList.map((company) => (
                        <li
                          key={company.id}
                          className={`px-4 py-2 cursor-pointer hover:bg-secondary text-sm truncate ${
                            selectedCompany?.id === company.id
                              ? "bg-secondary !text-white"
                              : ""
                          }`}
                          style={{
                            ...(selectedCompany?.id === company.id
                              ? { color: "#fff" }
                              : {}),
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "#fff")
                          }
                          onMouseLeave={(e) => {
                            if (selectedCompany?.id !== company.id) {
                              e.currentTarget.style.color = "";
                            }
                          }}
                          onClick={() => {
                            setSelectedCompany(company);
                            setShowCompanyDropdown(false);
                          }}
                        >
                          {company.companyName}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 relative">
            <button className="flex items-center gap-2 cursor-pointer">
              <span className="relative w-8 h-8 rounded-full bg-secondary items-center justify-center flex">
                <img src={userLight} alt="User Avatar" className="" />
              </span>
              <div className="text-left overflow-hidden">
                <h5 className="text-sm font-medium text-gray-500">{`${userName?.firstName} ${userName?.lastName}`}</h5>
                <p className="text-xs font-bold block !text-green-700">
                  {isRegistered ? "Register-" : "Unregister"}
                </p>
              </div>
            </button>
          </div>
        </header>        <div className="relative flex w-full h-[calc(100vh-60px)]">
          <div className={`relative block w-full`}>
            <NotificationPermissionHandler />
            <Outlet />
          </div>
          {/* {showDialpadModal && (
            <DialPadModal />
          )} */}
        </div>
      </div>
    </main>
  );
}

export default Index;
