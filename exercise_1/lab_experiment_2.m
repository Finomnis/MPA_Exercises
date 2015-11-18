clear;
close all;

[x, Fs] = audioread('Tone_C4_Piano.wav');
%[x, Fs] = audioread('Sound_TwoSineTwoImpulse.wav');
[samples, channels] = size(x);
if(channels > 1)
    x = (x(:,1)+x(:,2))/2;
end
N = 4096;
H = N/2;
w = hann(N);
gamma = 10;

chi = spectrogram(x, w, N-H);
Y = abs(chi).^2;

[m, k] = size(chi);
T_coeff = (0:k).*(H/Fs)+(H/Fs);
F_coeff = (0:m).*(Fs/N);

Y_compressed= log(1+gamma.*Y);


figure
imagesc(T_coeff, F_coeff, Y)
title('Spectrogram STFT - Original')
xlabel('Time in s')
ylabel('Frequency in Hz')
colorbar
axis xy

figure
imagesc(T_coeff, F_coeff, Y_compressed)
title('Spectrogram STFT - Compressed')
xlabel('Time in s')
ylabel('Frequency in Hz')
colorbar
axis xy