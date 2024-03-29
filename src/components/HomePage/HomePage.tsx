import React, { useState, useRef } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import styled from '@emotion/styled';
import {
  Button,
  Checkbox,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Switch,
  TextareaAutosize,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import SendIcon from '@mui/icons-material/Send';
import ElectricBolt from '@mui/icons-material/ElectricBolt';
import MicOff from '@mui/icons-material/MicOff';
import TextField from '@mui/material/TextField';
import { formConfig } from 'src/form-config';

const HomePage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    gender: 'Female',
    age: '',
    termsApproval: false,
    enableTracking: false,
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

      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/transcribe`, formData, {
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
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/fillForm`, {
          text: transcription,
          formData: formData,
          formConfig: formConfig,
        });
        // TODO: instead of replacing the whole form data we need to augment it with the LLM output
        // so that we do not erase already entered data
        console.log(JSON.parse(response.data.completion.choices[0].message.content));
        setFormData(JSON.parse(response.data.completion.choices[0].message.content));
      } catch (error) {
        console.error('Error');
      }
    }
  };

  return (
    <StyledBox>
      <Box display={'flex'} flexDirection={'column'} gap={'1rem'}>
        <StyledTextField id="name" label="Your name" variant="filled" value={formData.name} />
        <StyledTextField id="email" label="Your email" variant="filled" value={formData.email} />
        <StyledTextField id="address" label="Your address" variant="filled" value={formData.address} />

        <StyledFormControl>
          <StyledFormLabel id="gender-radio-buttons-group-label">Gender</StyledFormLabel>
          <RadioGroup
            id="gender"
            row
            aria-labelledby="gender-radio-buttons-group-label"
            value={formData.gender}
            name="gender-radio-buttons-group"
          >
            <FormControlLabel value="Female" control={<StyledRadio />} label="Female" />
            <FormControlLabel value="Male" control={<StyledRadio />} label="Male" />
            <FormControlLabel value="Other" control={<StyledRadio />} label="Other" />
          </RadioGroup>
        </StyledFormControl>

        <StyledFormControl>
          <StyledInputLabel id="age-select-label">Age</StyledInputLabel>
          <StyledSelect labelId="age-select-label" id="age" label="Age" value={formData.age}>
            <MenuItem value={'Under 20'}> Under 20 </MenuItem>
            <MenuItem value={'20 to 60'}> 20 to 60 </MenuItem>
            <MenuItem value={'Over 60'}> Over 60 </MenuItem>
          </StyledSelect>
        </StyledFormControl>

        <StyledFormControl>
          <FormControlLabel
            required
            control={<StyledCheckbox id="acceptTerms" checked={formData.termsApproval} />}
            label="I accept the terms and conditions"
          />
        </StyledFormControl>

        <StyledFormControl>
          <FormControlLabel
            control={<StyledSwitch id="enableTracking" checked={formData.enableTracking} />}
            label="Enable tracking"
          />
        </StyledFormControl>
      </Box>

      <Box display={'flex'} flexDirection={'column'} gap={'1rem'}>
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
        {transcription ? (
          <Box display={'flex'} justifyContent={'center'} alignItems={'center'}>
            <StyledTextArea value={transcription} />
          </Box>
        ) : null}
      </Box>
    </StyledBox>
  );
};

export default HomePage;

const StyledBox = styled(Box)`
  background-color: #282c34;
  min-height: 100vh;
  display: flex;
  align-items: start;
  justify-content: center;
  color: white;
  font-family: 'Roboto', sans-serif;
  gap: 4rem;
  padding: 3rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const StyledTextArea = styled(TextareaAutosize)`
  width: 100%;
  height: 300px;
  border-radius: 8px;
  border: 1px solid #ccc;
  padding: 10px;
  font-size: 16px;
  font-family: 'Roboto', sans-serif;
`;

const StyledTextField = styled(TextField)`
  background: white;
  width: 100%;
  border-radius: 8px;
`;
const StyledFormControl = styled(RadioGroup)`
  width: 100%;
`;

const StyledFormLabel = styled(FormLabel)`
  color: white;
`;

const StyledCheckbox = styled(Checkbox)`
  color: white;
`;

const StyledRadio = styled(Radio)`
  color: white;
`;

const StyledSwitch = styled(Switch)`
  color: white;
`;

const StyledSelect = styled(Select)`
  color: white;
  background: white;
`;

const StyledInputLabel = styled(InputLabel)`
  color: white;
`;
