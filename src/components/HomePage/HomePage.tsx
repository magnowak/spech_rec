import React, { useState, useRef } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import styled from '@emotion/styled';
import { Button, TextareaAutosize } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import SendIcon from '@mui/icons-material/Send';
import ElectricBolt from '@mui/icons-material/ElectricBolt';
import MicOff from '@mui/icons-material/MicOff';
import TextField from '@mui/material/TextField';

const HomePage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
  });

  const mediaRecorder = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorder.current = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
    }
    setIsRecording(false);
  };

  const transcribeAudio = async () => {
    if (!audioBlob) {
      console.error('No audio to transcribe');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.mp3');

      const response = await axios.post('http://localhost:3001/api/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setTranscription(response.data.transcription);
    } catch (error) {
      console.error('Error:', error.response ? error.response.data : error.message);
    }
  };

  const fillForm = async () => {
    if (transcription) {
      try {
        const response = await axios.post('http://localhost:3001/api/fillForm', { text: transcription });
        setFormData(JSON.parse(response.data.completion.choices[0].message.content));
      } catch (error) {
        console.error('Error');
      }
    }
  };

  return (
    <StyledBox>
      <StyledTextField id="name" label="Your name" variant="filled" value={formData.name} />
      <StyledTextField id="email" label="Your email" variant="filled" value={formData.email} />
      <StyledTextField id="address" label="Your address" variant="filled" value={formData.address} />
      <Box display="flex" justifyContent={'center'} alignItems={'center'} gap={'1rem'}>
        <Button
          variant="contained"
          onClick={startRecording}
          disabled={isRecording}
          color="primary"
          startIcon={<MicIcon />}
        >
          Start recording
        </Button>
        <Button
          variant="contained"
          onClick={stopRecording}
          disabled={!isRecording}
          color="primary"
          startIcon={<MicOff />}
        >
          Stop Recording
        </Button>
      </Box>
      <Box display="flex" justifyContent={'center'} alignItems={'center'} gap={'1rem'}>
        <Button
          variant="contained"
          color="secondary"
          onClick={transcribeAudio}
          disabled={!audioBlob}
          startIcon={<SendIcon />}
        >
          Transcribe Audio
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={fillForm}
          disabled={!transcription}
          startIcon={<ElectricBolt />}
        >
          Fill form
        </Button>
      </Box>
      {transcription ? (
        <Box display={'flex'} justifyContent={'center'} alignItems={'center'}>
          <StyledTextArea value={transcription} />
        </Box>
      ) : null}
    </StyledBox>
  );
};

export default HomePage;

const StyledBox = styled(Box)`
  background-color: #282c34;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-family: 'Roboto', sans-serif;
  gap: 2rem;
`;

const StyledTextArea = styled(TextareaAutosize)`
  width: 400px;
  height: 300px;
  border-radius: 8px;
  border: 1px solid #ccc;
  padding: 10px;
  font-size: 16px;
  font-family: 'Roboto', sans-serif;
`;

const StyledTextField = styled(TextField)`
  background: white;
  width: 400px;
  border-radius: 8px;
`;
