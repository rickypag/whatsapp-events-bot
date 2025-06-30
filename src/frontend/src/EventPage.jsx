import React from "react";
import { useParams } from "react-router";
import "./EventPage.css";

const EventPage = () => {
  let params = useParams();
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState();
  const [data, setData] = React.useState();

  const fetchEventData = async () => {
    try {
      const response = await fetch("https://s5an8y349f.execute-api.us-east-1.amazonaws.com/prod/event/" + params.eventId);
      const data = await response.json();
      console.log(data);
      if(data["error"]) {
        setError(data["error"])
      }
      else {
        setData(data);
      }
    } catch (error) {
      setError("Error fetching event data");
    } finally {
      setIsLoading(false);
    }
  }

  React.useEffect(() => {
    fetchEventData();
  }, [params.eventId]);

  if(isLoading) {
    return <div>Loading...</div>;
  }
  else if(data) {
    return (
      <div className="event-container">
        <img
          src={data["image_url"]} // https://fastly.picsum.photos/id/237/500/600.jpg?hmac=lGGv-UUaA8_K5xRoWLrKJXCHxtCW-BQl2f7PpS6TsSE"
          alt="Event Poster"
          className="event-poster"
        />
        <h1 className="event-title">{data["name"]}</h1>
        <div className="event-detail">
          <span className="icon">🕒</span>
          <span className="text">{data["date"]}</span>
        </div>
        <div className="event-detail">
          <span className="icon">📍</span>
          <span className="text">{data["address"]}</span>
        </div>
        <p className="event-description">
          {data["description"]}
        </p>
      </div>
    );
  }
  else if(error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );
  }
  
};

export default EventPage;
