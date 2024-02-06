import Jwt from "jsonwebtoken";
const generatetokeandsetcookie = (userId, res) => {
  const token = Jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "10d",
  });
  res.cookie("jwt", token, {
    httpOnly: true, // This is not accessible by the browser which makes it more secure
    maxAge: 10 * 24 * 60 * 60 * 1000, //10 days
    sameSite: "strict", //this is for more security purpose.
  });
  return token;
};

export default generatetokeandsetcookie;
