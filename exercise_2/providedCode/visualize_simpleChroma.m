function [ ] = visualize_simpleChroma( f_chroma, H, fs )
%visualize_simpleChroma Visualizes chroma features
% H : hop size
% fs: sampling rate

% time in seconds
t = ( 1:size(f_chroma, 2) ) * H / fs;


figure;
imagesc(t, 1:12, f_chroma);
colorbar;
axis xy;
colormap(hot);

title('Chromagram');
xlabel('Time in seconds');
ylabel('Chroma');

set(gca, 'YTick', 1:12)
set(gca,'YTickLabel',{'C'; 'C#'; 'D'; 'D#'; 'E'; 'F'; 'F#'; 'G'; 'G#'; 'A'; 'A#'; 'B'});


end

