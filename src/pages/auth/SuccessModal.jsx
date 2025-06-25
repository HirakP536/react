import { useNavigate } from 'react-router';

const SuccessModal = ({setIsOpen}) => {
    const navigate = useNavigate();
    const handleNavihate = () => {
        navigate('/login');
        setIsOpen(false);
    };
    return (
        <div className="fixed inset-0 z-[999] w-full flex items-center justify-center">
            <div
                className="fixed inset-0 z-[99]"
                style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
            />
            <div className="absolute w-full max-w-[400px] bg-white z-[999] rounded-xl p-8 duration-300 ease-in-out">
                <div className="flex flex-col items-center justify-center h-full mb-4">
                    {/* Success SVG Icon */}
                    <svg
                        className="text-green-600 dark:text-gray-500 w-11 h-11 mb-3.5 mx-auto"
                        aria-hidden="true"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="#22c55e" opacity="0.15"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2l4-4" />
                    </svg>
                    <h1 className="text-2xl text-center mb-2.5">
                        Password Changed Successfully
                    </h1>
                    <p className="text-sm text-center">
                        You have successfully changed your password.
                    </p>
                </div>
                <div className="flex items-center justify-center">
                    <button
                        className="bg-secondary !text-white text-sm cursor-pointer px-4 py-2 h-10 rounded-lg"
                        onClick={handleNavihate}
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SuccessModal;