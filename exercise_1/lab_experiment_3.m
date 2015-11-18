clear;
close all;

[x, Fs] = audioread('Scale_Chromatic_Piano.wav');
[samples, channels] = size(x);
if(channels > 1)
    x = (x(:,1)+x(:,2))/2;
end
N = 1024;
H = N/2;
w = hann(N);
gamma = 10;

chi = spectrogram(x, w, N-H);
Y = abs(chi).^2;
[k, m] = size(chi);
T_coeff = (0:m).*(H/Fs)+(H/Fs);
F_coeff = (0:k).*(Fs/N);

Y_lf = zeros(127, m);
for p=0:127
    for k_lf = find(2^((p-0.5-69)/12)*440 <= F_coeff & 2^((p+0.5-69)/12)*440 > F_coeff)
        Y_lf(p,:) = Y_lf(p,:) + Y(k_lf,:);
    end
end


Y_compressed= log(1+gamma.*Y);
Y_lf_compressed= log(1+gamma.*Y_lf);


figure
imagesc(T_coeff, F_coeff, Y_compressed)
title('Spectrogram STFT - Original')
xlabel('Time in s')
ylabel('Frequency in Hz')
colorbar
axis xy

figure
imagesc(T_coeff, 0:127, Y_lf_compressed)
title('Spectrogram STFT - Compressed')
xlabel('Time in s')
ylabel('Midi pitch')
colorbar
axis xy