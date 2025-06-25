import { Link } from "react-router";
import CardDrawer from "./CardDrawer";
import { useState } from "react";

const Card = ({ title, number, imgIcon }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        className="flex relative w-full p-3 sm:p-4 md:p-5 items-center justify-between bg-white rounded-[15px]"
        style={{ boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)" }}
      >
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="flex items-center justify-center w-6 sm:w-8 md:w-10">
            <img
              src={imgIcon}
              alt=""
              className="w-full h-auto object-contain"
            />
          </div>
          <p className="text-sm sm:text-base md:text-lg xl:text-xl font-semibold text-secondary">
            {title}
          </p>
        </div>{" "}
        {title === "User" ? (
          <Link
            to="/users"
            className="font-bold text-xl sm:text-2xl md:text-3xl xl:text-4xl !text-secondary"
          >
            <b>{number !== undefined && number !== null ? number : 0}</b>
          </Link>
        ) : (
          <h5
            className="text-xl sm:text-2xl md:text-3xl xl:text-4xl font-semibold cursor-pointer !text-secondary transition-colors"
            onClick={() => setIsOpen(true)}
          >
            {Array.isArray(number) ? number.length : number || 0}
          </h5>
        )}
      </div>
      <CardDrawer
        title={title}
        data={number}
        setIsOpen={setIsOpen}
        isOpen={isOpen}
      />
    </>
  );
};

export default Card;
