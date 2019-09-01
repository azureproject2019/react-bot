import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import ScrollToBottom from 'react-scroll-to-bottom';
import SwipeableViews from 'react-swipeable-views';
// import Container from 'react-bootstrap/Container';
// import Row from 'react-bootstrap/Row';
import Form from 'react-bootstrap/Form';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
class App extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      userMessage: '',
	    conversation: []
    };
  }



  componentDidMount() {
    this.startListenerWebSocketClient();
    this.startPublisherWebSocketClient();
  }

  startListenerWebSocketClient() {
    this.listenSocket = new WebSocket("wss://azure2019.fred.sensetecnic.com/api/public/messagepublish"); //server publishes
    this.listenSocket.onopen = () => {
      // on connecting, do nothing but log it to the console
      console.log('connected')
    }

    function isHTML(str) {
      var doc = new DOMParser().parseFromString(str, "text/html");
      return Array.from(doc.body.childNodes).some(node => node.nodeType === 1);
    }

    this.listenSocket.onmessage = event => {
      // on receiving a message, add it to the list of messages
      let mockObj= JSON.stringify([ {
        "room___roomId": 12682,
        "room___roomTypeId": 1001,
        "room___hotelId": 3,
        "room___booked": 0,
        "hotel___hotelId": 3,
        "hotel___name": "Joe Mcclure",
        "hotel___city": "North Margaret",
        "hotel___country": "Afghanistan",
        "roomtype___roomTypeId": 1001,
        "roomtype___roomType": "Deluxe",
        "roomtype___price": 3750
      } ]);

      let message='';

      if(isHTML(event.data.trim())) {
        message='Some thing went wrong, please try again after some time.'
      } else {
        message=event.data.trim();
      }
      const msg = {
        text: message,
        //text:mockObj,
        user: 'ai',
      };
      this.setState({
        conversation: [...this.state.conversation, msg],
      });
      this.listenSocket.onclose = () => {
        console.log('disconnected');
        this.listenSocket=null;
        // automatically try to reconnect on connection loss
        //this.listenSocket =  new WebSocket("wss://azure2019.fred.sensetecnic.com/api/public/messagepublish");
        this.startListenerWebSocketClient();
      }
    }

  }
  startPublisherWebSocketClient() {
    this.publishSocket = new WebSocket("wss://azure2019.fred.sensetecnic.com/api/public/messagereceive");

    this.publishSocket.onopen = () => {
      // on connecting, do nothing but log it to the console
      console.log('connected')
    }



    this.publishSocket.onmessage = evt => {
      // on receiving a message, add it to the list of messages
      const message = JSON.parse(evt.data)
      this.addMessage(message)
    }

    this.publishSocket.onclose = () => {
      console.log('disconnected');
      this.publishSocket=null;
      // automatically try to reconnect on connection loss
      //this.publishSocket =  new WebSocket("wss://azure2019.fred.sensetecnic.com/api/public/messagereceive");
      this.startPublisherWebSocketClient();
    }

  }
  submitMessage = messageString => {
    // on submitting the ChatInput form, send the message, add it to the list and reset the input
    const message = { channelType: 'chatbot', message: messageString }
    this.publishSocket.send(JSON.stringify(message))
  }
  handleChange = event => {
    this.setState({ userMessage: event.target.value });
  };

  handleSubmit = event => {
    event.preventDefault();
    if (!this.state.userMessage.trim()) return;

    const msg = {
      text: this.state.userMessage,
      user: 'human',
    };

    this.setState({
      conversation: [...this.state.conversation, msg],
    });

    /*fetch('http://localhost:5000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: this.state.userMessage,
      }),
    });*/

    this.submitMessage({
      message: this.state.userMessage,
    });

    this.setState({ userMessage: '' });
  };

  isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

  getContent(event, className, i) {
    if(event.user === 'human') {
      return (<div key={`${className}-${i}`} className={`${className} chat-bubble`}>
        <span className="chat-content">{event.text}</span>
      </div>);
    } else {
      //let convertedstr=hparse(event.text.trim());
     if(this.isJson(event.text)) {
       const items=JSON.parse(event.text);
        return (
          // <SwipeableViews enableMouseEvents className="card-container">
          //     {items.map((item) =>
          //         <a className="card">
          //           {Object.keys(item).map(function (key) {
          //             return (
					// 	  (<h6 className="room-detail">{key}<span>{item[key]}</span></h6>)
          //             )
          //         }
          //         )}
          //         </a>
          //     )
          //     }
          //   </SwipeableViews>
            <div className="card-container">
              {items.map((item) =>
                  <a className="card">
                    {Object.keys(item).map(function (key) {
                      return (
						  (<div><h6 className="room-detail">{key}</h6><span className="room-response">{item[key]}</span></div>)
                      )
                  }
                  )}
                  </a>
              )
              }
            </div>
        );
     } else {
       return (<div key={`${className}-${i}`} className={`${className} chat-bubble`}>
         <span className="chat-content">{event.text}</span>
       </div>);
     }
    }
  }

  sendEmail(conversation, publisher) {

    //ReactDOM.findDOMNode().innerHTML
    const message = { channelType: 'email', message: conversation, subject: 'Chat History', to:'lionelpannaisamy@gmail.com;tamilselvam.r@gmail.com;rk@softonics.in' };
    console.log(JSON.stringify(message));
    publisher.send(JSON.stringify(message));
  }
  // editSlogan(){
  //   return (
  //       // <input type="text" value={this.props.slogan} onChange={this.saveEdit}/>

  //   );
  // }
  render() {

    const ChatBubble = (event, i, className) => {
      return (
          <div>{this.getContent(event, className, i)}</div>

      );
    };

    const chat = this.state.conversation.map((e, index) =>
      ChatBubble(e, index, e.user)
    );
    const mailIcon=require('./icons8-send-mail-100.png');
    const closeIcon=require('./error.png');
    const mailIdIcon=require('./icons8-send-mail-100 (1).png')
    const jiraTicketIcon=require('./ticket.png');
    const FacebookIcon=require('./facebook.png');
    const googleIcon=require('./search.png');
    const twitterIcon=require('./twitter.png');
    const emailIcon=require('./email.png');

    return (
        <div id="chat">
          {/* <div className="col-md-12">
              <h1>{this.props.name}</h1>
              <p onClick={this.editSlogan}>Hello</p>
          </div> */}

        <div className="chat-button-theme-bubble">
          <div className="button-greeting">
            <div className="button-greeting-close">
            <svg 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z">
              </path> 
              <path 
                d="M0 0h24v24H0z" 
                fill="none">
              </path>
            </svg>
            </div>
            {/* <div className="button-greeting-content-wrapper">
              <div className="button-greeting-content">Hey I'm a ChatBot!</div>
            </div> */}
          </div>
          <div className="chat-button">
            <svg xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" className="chat-icon" 
            >
            <path
              className="chat-path" 
              d="M9.37,1.34H10.8a8.2,8.2,0,0,1,0,16.39H9.37a10,10,0,0,1-2.68-.45c-.55-.15-2.23,1.81-2.63,1.36s.05-2.79-.41-3.23q-.28-.27-.54-.57A8.2,8.2,0,0,1,9.37,1.34Z"
             >
            </path> 
            <line 
              className="chat-line"
              x1="6.37"
              y1="7.04"
              x2="12.58" 
              y2="7.04" 
              >
            </line> 
            <line 
              className="chat-line"
              x1="6.37" 
              y1="9.66" 
              x2="14.31" 
              y2="9.66" 
              >
            </line> 
            <line 
              className="chat-line"
              x1="6.37" 
              y1="12.28" 
              x2="11.42" 
              y2="12.28" 
              >
            </line>
            </svg>
          </div>
        </div>
          <div id="chatbot-open" className="chat-window chat-modal-window">
            <div className="chat-heading">
              <h1 className="animate-chat">React Chatbot</h1>
              <div className="interior">
                {/* <button type="button" className="btn btn-primary"  data-toggle="modal" data-target="#exampleModalCenter">Login</button> */}
                <img className="mail-box" onClick={() => this.sendEmail(this.state.conversation, this.publishSocket)} src={mailIcon} title="Send Conversation"/>
                <a  href="#open-modal"><img className="mailId-box" src={mailIdIcon} title="Enter Your Mail"/></a>
                <a  href="#open-jira-modal"><img className="mailId-box" src={jiraTicketIcon} title="Enter Your Mail"/></a>
                <a  href="#open-login-modal">Login</a>
              </div>
                  
              <div id="open-modal" className="modal-window">
                <div>
                <a href="#" title="Close" className="modal-close"><img className="close-icon" src={closeIcon}/></a>
                  <form className="form">
                  <div className="form-group">
                    <label for="exampleFormControlInput1">Email address</label>
                    <input type="email" className="form-control" id="exampleFormControlInput1" placeholder="Your E-Mail Address"/>
                  </div>
	                  {/* <input type="email" class="form__field" placeholder="Your E-Mail Address" /> */}
                    <div className="d-flex justify-content-center">
			              <button type="button" className="btn btn--primary btn--inside uppercase">Send</button>
			              <button type="button" className="btn btn--danger btn--inside uppercase">Close</button>
                    </div>
                  </form>
                </div>
              </div>
              
              <div id="open-jira-modal" className="modal-window">
                <div>
                <a href="#" title="Close" className="modal-close"><img className="close-icon" src={closeIcon}/></a>
                <form className="form">
                  <div className="form-group">
                    <label for="exampleFormControlSelect1">Issue Type</label>
                    <select className="form-control" id="exampleFormControlSelect1">
                      <option>1</option>
                      <option>2</option>
                      <option>3</option>
                      <option>4</option>
                      <option>5</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label for="exampleFormControlTextarea1">Description</label>
                    <textarea className="form-control" id="exampleFormControlTextarea1" rows="3"></textarea>
                  </div>
                  <div className="d-flex justify-content-center">
			              <button type="button" class="btn btn--primary btn--inside uppercase">Ok</button>
			              <button type="button" class="btn btn--danger btn--inside uppercase">Close</button>
                  </div>
                  </form>
                </div>
              </div>
              <div id="open-login-modal" className="modal-login modal-window d-flex justify-content-center">
               <div >
                <a href="#" title="Close" className="modal-close"><img className="close-icon" src={closeIcon}/></a>
                <div className="modal-text">
                <h3 className="modal-header">Welcome Back</h3>
                <p>Sign in to get personalized story recommendations, follow authors and topics you love, and interact with stories.</p>
                <button className="btn btn--primary--outline"><img className="btn-icon" src={FacebookIcon} />Log in with Facebook</button>
                <button className="btn btn--primary--outline"><img className="btn-icon" src={googleIcon} />Log in with Google</button>               
                <button className="btn btn--primary--outline"><img className="btn-icon" src={twitterIcon} />Log in with Twitter</button> 
                <button className="btn btn--primary--outline"><img className="btn-icon" src={emailIcon} />Log in with Mail</button>               
                </div>
               </div>
              </div>
              </div>
            <ScrollToBottom className="conversation-view ">

              <p  id={'chathistory'}>{chat}</p>
              {/* {
   "room___roomId": 12682,
   "room___roomTypeId": 1001,
   "room___hotelId": 3,
   "room___booked": 0,
   "hotel___hotelId": 3,
   "hotel___name": "Joe Mcclure",
   "hotel___city": "North Margaret",
   "hotel___country": "Afghanistan",
   "roomtype___roomTypeId": 1001,
   "roomtype___roomType": "Deluxe",
   "roomtype___price": 3750
 } */}
              
              {/*------------------------- loading indicator -----------*/}
              <div className="ticontainer">
                <div className="tiblock">
                  <div className="tidot"></div>
                  <div className="tidot"></div>
                  <div className="tidot"></div>
                </div>
              </div> 
			  </ScrollToBottom> 
              <form onSubmit={this.handleSubmit}>
              <input
                  value={this.state.userMessage}
                  onInput={this.handleChange}
                  className="css-input"
                  type="text"
                  autoFocus
                  placeholder="Type your message and hit Enter to send"    />
            </form>
        </div>
		</div>
    );
  }
}
export default App;