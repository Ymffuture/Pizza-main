import { useEffect, useState } from "react";
import { getMenu } from "../api/menu.api";
import MenuCard from "../components/MenuCard";
import { useNavigate } from "react-router-dom";

export default function Menu() {
  const [menu, setMenu] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getMenu().then((res) => setMenu(res.data));
  }, []);

  return (
    <div className="grid md:grid-cols-3 gap-6 p-6">
      {menu.map((item) => (
        <MenuCard
          key={item.id}
          item={item}
          onSelect={() => navigate(`/checkout?item=${item.id}`)}
        />
      ))}
    </div>
  );
}
